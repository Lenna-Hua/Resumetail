"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppSession, ResumeBullet, ResumeSection } from "@/lib/types";
import { clearSession, loadSession, saveSession } from "@/lib/storage";
import { clearAllPersistedData } from "@/lib/browser-store";
import { parseResumeBullets } from "@/lib/resume-parser";
import { computeCoverage } from "@/lib/coverage";
import { getAtsSiteOverview, runAtsCheck } from "@/lib/ats-checker";
import { computeMatchScore } from "@/lib/match-score";
import { mapSkillsToResume } from "@/lib/skill-mapping";
import { suggestTrim } from "@/lib/page-estimate";
import { analyzeImportHealth, type ImportHealthReport } from "@/lib/import-health";
import { DEFAULT_ATS_FONT } from "@/lib/ats-fonts";
import { normalizeParsedJD } from "@/lib/coverage";
import {
  parseStructuredResume,
  sectionsToResumeText,
  updateSectionItem,
  moveSectionItem,
  reorderSectionItem,
  addSectionItem,
  insertSectionItemAt,
  addBlocksToSections,
  resumeTextForExport,
} from "@/lib/structured-resume";
import {
  createVersion,
  getVersion,
  loadVersions,
  saveTailoredVersion,
  updateVersion,
} from "@/lib/resume-versions";
import { recordApplicationAnalysis } from "@/lib/application-history";
import { copyShareLink } from "@/lib/share-link";
import { ApplicationHistoryPanel } from "@/components/application-history-panel";
import { jdToSummary } from "@/lib/jd-summary";
import { exportResumePdf } from "@/lib/pdf-export";
import { exportResumeDocx } from "@/lib/docx-export";
import { ChecksPanel } from "@/components/checks-panel";
import { JdInsightsPanel } from "@/components/jd-insights-panel";
import { ResumeEditorPanel } from "@/components/resume-editor-panel";
import { VersionPicker } from "@/components/version-picker";
import { BaseDiffPanel } from "@/components/base-diff-panel";
import { ContentLibraryPanel } from "@/components/content-library-panel";
import { CustomizePanel } from "@/components/customize-panel";
import { CoverLetterPanel } from "@/components/cover-letter-panel";
import { ReviewPanel } from "@/components/review-panel";
import { ImportHealthStrip } from "@/components/import-health-strip";
import { ContentLibrarySheet } from "@/components/content-library-sheet";
import { DesktopWorkspaceShell } from "@/components/desktop-workspace-shell";
import { MobileMoreNav, type MoreSection } from "@/components/mobile-more-nav";
import { TemplatePreview } from "@/components/template-preview";
import {
  MobileWorkspaceShell,
  PasteClipboardButton,
} from "@/components/mobile-workspace-shell";
import { PreviewBottomSheet } from "@/components/preview-bottom-sheet";
import { VersionHeaderSwitcher } from "@/components/version-header-switcher";
import { formatSaveLabel } from "@/lib/save-label";
import { getTemplate, loadSelectedTemplateId, saveSelectedTemplateId } from "@/lib/resume-templates";
import { loadTemplateSettings, saveTemplateSettings } from "@/lib/template-settings";
import type { ContentBlock, ResumeTemplateId, TemplateSettings } from "@/lib/types";
import type { LibraryDragPayload } from "@/lib/library-drag";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useWorkspaceMode } from "@/hooks/use-workspace-mode";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Download,
  Library,
  Link2,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

function runChecks(
  resumeText: string,
  session: AppSession,
  templateId: ResumeTemplateId = "classic",
) {
  const parsedJD = session.parsedJD;
  const coverage = parsedJD ? computeCoverage(resumeText, parsedJD) : session.coverage;
  const twoColumnLayout = getTemplate(templateId).layout === "two-column";
  return {
    coverage,
    atsResult: runAtsCheck(resumeText, parsedJD, coverage),
    matchScore: computeMatchScore(resumeText, parsedJD, coverage, { twoColumnLayout }),
    bullets: parseResumeBullets(resumeText),
  };
}

const PERSIST_DEBOUNCE_MS = 400;
const CHECKS_DEBOUNCE_MS = 300;
const PREVIEW_DEBOUNCE_MS = 200;

interface TailoringWorkspaceProps {
  versionId?: string;
}

export function TailoringWorkspace({ versionId }: TailoringWorkspaceProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { mode, setMode } = useWorkspaceMode("edit");
  const [session, setSession] = useState<AppSession | null>(null);
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [tailoringId, setTailoringId] = useState<string | null>(null);
  const [versionKey, setVersionKey] = useState(0);
  const [templateId, setTemplateId] = useState<ResumeTemplateId>("classic");
  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>(() =>
    loadTemplateSettings("classic"),
  );
  const [libraryKey, setLibraryKey] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveLabelTick, setSaveLabelTick] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [librarySheetOpen, setLibrarySheetOpen] = useState(false);
  const [moreSection, setMoreSection] = useState<MoreSection>("style");
  const [importHealth, setImportHealth] = useState<ImportHealthReport | null>(null);
  const [focusBulletId, setFocusBulletId] = useState<string | null>(null);
  const [allVersions, setAllVersions] = useState(() =>
    typeof window === "undefined" ? [] : loadVersions(),
  );
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSessionRef = useRef<AppSession | null>(null);
  const templateIdRef = useRef(templateId);

  useEffect(() => {
    templateIdRef.current = templateId;
  }, [templateId]);

  const writeSessionToStorage = useCallback((next: AppSession) => {
    saveSession(next);
    setSavedAt(new Date());
    if (next.activeVersionId && next.resumeText.trim()) {
      updateVersion(next.activeVersionId, { resumeText: next.resumeText });
    }
  }, []);

  const flushPendingPersist = useCallback(() => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    if (checksTimerRef.current) {
      clearTimeout(checksTimerRef.current);
      checksTimerRef.current = null;
    }
    if (latestSessionRef.current) {
      writeSessionToStorage(latestSessionRef.current);
    }
  }, [writeSessionToStorage]);

  useEffect(() => () => flushPendingPersist(), [flushPendingPersist]);

  useEffect(() => {
    const id = window.setInterval(() => setSaveLabelTick((t) => t + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  const saveLabel = useMemo(() => {
    void saveLabelTick;
    return formatSaveLabel(savedAt);
  }, [savedAt, saveLabelTick]);

  const refreshVersions = useCallback(() => {
    setAllVersions(loadVersions());
    setVersionKey((k) => k + 1);
  }, []);

  const handleMobileModeChange = useCallback(
    (next: Parameters<typeof setMode>[0]) => {
      if (next === "customize") setMoreSection("style");
      setMode(next);
    },
    [setMode],
  );

  const handleMoreSectionChange = useCallback(
    (section: MoreSection) => {
      setMoreSection(section);
      if (section === "review") {
        setMode("review");
        return;
      }
      if (section === "library") {
        setLibrarySheetOpen(true);
        setMode("customize");
        return;
      }
      setMode("customize");
    },
    [setMode],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const id = loadSelectedTemplateId();
      setTemplateId(id);
      setTemplateSettings(loadTemplateSettings(id));
    });
  }, []);

  useEffect(() => {
    const loaded = loadSession();

    if (versionId) {
      const version = getVersion(versionId);
      if (!version) {
        router.replace("/app");
        return;
      }
      const resumeText = version.resumeText.trim() || loaded.resumeText;
      const sessionWithVersion = {
        ...loaded,
        activeVersionId: versionId,
        resumeText,
      };
      const structured = parseStructuredResume(resumeText);
      const checks = runChecks(resumeText, sessionWithVersion, loadSelectedTemplateId());
      const hydrated = { ...sessionWithVersion, ...checks };
      queueMicrotask(() => {
        setSections(structured.sections);
        setSession(hydrated);
        latestSessionRef.current = hydrated;
        saveSession(hydrated);
        setSavedAt(new Date(hydrated.updatedAt));
        refreshVersions();
      });
      return;
    }

    queueMicrotask(() => {
      if (!loaded.resumeText.trim()) {
        setSession(loaded);
        return;
      }

      let activeVersionId = loaded.activeVersionId;
      const versions = loadVersions();
      if (!activeVersionId || !versions.find((v) => v.id === activeVersionId)) {
        const created =
          versions.length === 0 ? createVersion(loaded.resumeText) : versions[0];
        activeVersionId = created.id;
      }

      const sessionWithVersion = { ...loaded, activeVersionId };
      const structured = parseStructuredResume(loaded.resumeText);
      setSections(structured.sections);
      const checks = runChecks(loaded.resumeText, sessionWithVersion, loadSelectedTemplateId());
      const hydrated = { ...sessionWithVersion, ...checks };
      setSession(hydrated);
      latestSessionRef.current = hydrated;
      saveSession(hydrated);
      setSavedAt(new Date(hydrated.updatedAt));
      refreshVersions();
    });
  }, [versionId, router, refreshVersions]);

  const persist = useCallback(
    (next: AppSession) => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      latestSessionRef.current = next;
      setSession(next);
      writeSessionToStorage(next);
    },
    [writeSessionToStorage],
  );

  const persistDraft = useCallback(
    (next: AppSession) => {
      latestSessionRef.current = next;
      setSession(next);
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        if (latestSessionRef.current) {
          writeSessionToStorage(latestSessionRef.current);
        }
        persistTimerRef.current = null;
      }, PERSIST_DEBOUNCE_MS);
    },
    [writeSessionToStorage],
  );

  const scheduleChecks = useCallback((resumeText: string, baseSession: AppSession) => {
    if (checksTimerRef.current) clearTimeout(checksTimerRef.current);
    checksTimerRef.current = setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const checks = runChecks(resumeText, { ...baseSession, ...prev, resumeText }, templateIdRef.current);
        const next = { ...prev, resumeText, ...checks };
        latestSessionRef.current = next;
        return next;
      });
      checksTimerRef.current = null;
    }, CHECKS_DEBOUNCE_MS);
  }, []);

  const updateResumeFromSections = useCallback(
    (nextSections: ResumeSection[], baseSession: AppSession) => {
      const resumeText = sectionsToResumeText(nextSections);
      setSections(nextSections);
      persistDraft({ ...baseSession, resumeText });
      scheduleChecks(resumeText, baseSession);
    },
    [persistDraft, scheduleChecks],
  );

  const applyResumeText = useCallback(
    (resumeText: string, baseSession: AppSession, reparse = true) => {
      if (reparse) {
        const structured = parseStructuredResume(resumeText);
        setSections(structured.sections);
      }
      persistDraft({ ...baseSession, resumeText });
      scheduleChecks(resumeText, baseSession);
    },
    [persistDraft, scheduleChecks],
  );

  const handleResumeTextChange = (text: string) => {
    if (!session) return;
    applyResumeText(text, session);
  };

  const handleSectionItemChange = (
    sectionId: string,
    itemId: string,
    content: string,
  ) => {
    if (!session) return;
    const nextSections = updateSectionItem(sections, sectionId, itemId, content);
    updateResumeFromSections(nextSections, session);
  };

  const handleSectionItemReorder = (
    sectionId: string,
    itemId: string,
    direction: "up" | "down",
  ) => {
    if (!session) return;
    const nextSections = moveSectionItem(sections, sectionId, itemId, direction);
    updateResumeFromSections(nextSections, session);
  };

  const handleSectionItemDrop = (
    sectionId: string,
    fromIndex: number,
    toIndex: number,
  ) => {
    if (!session) return;
    const nextSections = reorderSectionItem(sections, sectionId, fromIndex, toIndex);
    updateResumeFromSections(nextSections, session);
  };

  const handleAddBlockToResume = (block: ContentBlock) => {
    if (!session) return;
    const itemType = block.type === "summary" ? "text" : "bullet";
    const nextSections = addSectionItem(
      sections,
      block.sectionName,
      block.content,
      itemType,
    );
    updateResumeFromSections(nextSections, session);
  };

  const handleAddBlocksToResume = (blocks: ContentBlock[]) => {
    if (!session || blocks.length === 0) return;
    const nextSections = addBlocksToSections(sections, blocks);
    updateResumeFromSections(nextSections, session);
  };

  const handleApplyProfileToResume = (resumeText: string) => {
    if (!session) return;
    applyResumeText(resumeText, session);
  };

  const handleLibraryBlockDrop = (
    sectionId: string,
    index: number,
    payload: LibraryDragPayload,
  ) => {
    if (!session) return;
    const itemType = payload.type === "summary" ? "text" : "bullet";
    const targetSection = sections.find((s) => s.id === sectionId);
    const nextSections = targetSection
      ? insertSectionItemAt(sections, sectionId, index, payload.content, itemType)
      : addSectionItem(sections, payload.sectionName, payload.content, itemType);
    updateResumeFromSections(nextSections, session);
  };

  const handleTemplateSelect = (id: ResumeTemplateId) => {
    setTemplateId(id);
    saveSelectedTemplateId(id);
    const nextSettings = {
      ...templateSettings,
      accentColor: getTemplate(id).defaultAccentColor,
    };
    setTemplateSettings(nextSettings);
    saveTemplateSettings(nextSettings);
    if (session?.resumeText.trim()) {
      const checks = runChecks(session.resumeText, session, id);
      persist({ ...session, ...checks });
    }
  };

  const handleTemplateSettingsChange = (settings: TemplateSettings) => {
    setTemplateSettings(settings);
    saveTemplateSettings(settings);
  };

  const handleFileExtracted = (text: string) => {
    if (!session) return;
    let activeVersionId = session.activeVersionId;
    const versions = loadVersions();
    if (!activeVersionId || !versions.find((v) => v.id === activeVersionId)) {
      const created = createVersion(text);
      activeVersionId = created.id;
    } else {
      updateVersion(activeVersionId, { resumeText: text });
    }
    setImportHealth(analyzeImportHealth(text));
    applyResumeText(text, { ...session, activeVersionId });
    setVersionKey((k) => k + 1);
  };

  const handleApplyAtsTemplate = () => {
    handleTemplateSelect("simple-ats");
    const nextSettings = {
      ...templateSettings,
      fontFamily: DEFAULT_ATS_FONT,
      accentColor: getTemplate("simple-ats").defaultAccentColor,
    };
    setTemplateSettings(nextSettings);
    saveTemplateSettings(nextSettings);
    setImportHealth(null);
  };

  const handleAddSkillConfirm = (phrase: string) => {
    if (!session) return;
    const confirmed = window.confirm(
      `Add “${phrase}” to your Skills section?\n\nOnly confirm if you truly have this skill. Do not list skills you don’t possess.`,
    );
    if (!confirmed) return;
    const nextSections = addSectionItem(sections, "Skills", phrase, "bullet");
    updateResumeFromSections(nextSections, session);
  };

  const handleFocusBullet = (bulletId: string) => {
    setFocusBulletId(bulletId);
    if (!isDesktop) {
      handleMoreSectionChange("review");
    } else {
      setMode("review");
    }
    queueMicrotask(() => {
      document.getElementById(`review-bullet-${bulletId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  };

  const handleAnalyzeJd = async () => {
    if (!session) return;
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/extract-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText: session.jdText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze job description");

      const parsedJD = normalizeParsedJD(data.parsedJD);
      const nextSession = { ...session, parsedJD };
      const checks = runChecks(session.resumeText, nextSession, templateId);
      const hydrated = { ...nextSession, ...checks };
      persist(hydrated);
      recordApplicationAnalysis(hydrated, session.activeVersionId);
      setHistoryKey((k) => k + 1);
      if (!isDesktop) setMode("checks");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  };

  const tailorBullet = async (bulletId: string) => {
    if (!session?.parsedJD) return;
    setError(null);
    setTailoringId(bulletId);
    const bullet = session.bullets.find((b) => b.id === bulletId);
    if (!bullet) return;

    const loadingBullets = session.bullets.map((b) =>
      b.id === bulletId ? { ...b, status: "loading" as const } : b,
    );
    persist({ ...session, bullets: loadingBullets });

    try {
      const res = await fetch("/api/tailor-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: bullet.currentText,
          section: bullet.section,
          resumeContext: session.resumeText,
          jdSummary: jdToSummary(session.parsedJD),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to tailor bullet");

      const nextBullets = session.bullets.map((b) =>
        b.id === bulletId
          ? {
              ...b,
              suggestion: data.suggestion,
              alignedJdElements: data.alignedJdElements,
              status: "suggested" as const,
            }
          : b,
      );
      persist({ ...session, bullets: nextBullets });
    } catch (e) {
      const reverted = session.bullets.map((b) =>
        b.id === bulletId ? { ...b, status: "pending" as const } : b,
      );
      persist({ ...session, bullets: reverted });
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setTailoringId(null);
    }
  };

  const acceptSuggestion = (bulletId: string, editedText?: string) => {
    if (!session) return;
    const nextBullets = session.bullets.map((b) => {
      if (b.id !== bulletId || !b.suggestion) return b;
      const finalText = (editedText ?? b.suggestion).trim() || b.suggestion;
      const wasEdited = finalText !== b.suggestion;
      return {
        ...b,
        currentText: finalText,
        suggestion: undefined,
        status: wasEdited ? ("edited" as const) : ("accepted" as const),
      };
    });
    const resumeText = buildResumeFromBullets(nextBullets, session.resumeText);
    applyResumeText(resumeText, { ...session, bullets: nextBullets });
  };

  const editSuggestion = (bulletId: string, text: string) => {
    if (!session) return;
    persistDraft({
      ...session,
      bullets: session.bullets.map((b) =>
        b.id === bulletId ? { ...b, suggestion: text, status: "edited" as const } : b,
      ),
    });
  };

  const rejectSuggestion = (bulletId: string) => {
    if (!session) return;
    persist({
      ...session,
      bullets: session.bullets.map((b) =>
        b.id === bulletId
          ? { ...b, suggestion: undefined, status: "rejected" as const }
          : b,
      ),
    });
  };

  const restoreOriginal = (bulletId: string) => {
    if (!session) return;
    const nextBullets = session.bullets.map((b) =>
      b.id === bulletId
        ? { ...b, currentText: b.original, suggestion: undefined, status: "pending" as const }
        : b,
    );
    const resumeText = buildResumeFromBullets(nextBullets, session.resumeText);
    applyResumeText(resumeText, { ...session, bullets: nextBullets });
  };

  const handleClearData = () => {
    clearAllPersistedData();
    clearSession();
    const fresh = loadSession();
    setSession(fresh);
    setSections([]);
    setError(null);
    setVersionKey((k) => k + 1);
    router.push("/app");
  };

  const handleSaveTailoredCopy = () => {
    if (!session?.activeVersionId || !session.parsedJD) return;
    const copy = saveTailoredVersion(
      session.activeVersionId,
      session.resumeText,
      session.parsedJD.roleTitle,
    );
    if (copy) {
      refreshVersions();
      router.push(`/app/v/${copy.id}?mode=edit`);
    }
  };

  const saveTailoredButton =
    session?.parsedJD && session.activeVersionId ? (
      <Button
        variant="outline"
        className="min-h-11 w-full"
        onClick={handleSaveTailoredCopy}
        disabled={!session.resumeText.trim()}
      >
        <Save className="size-4" />
        Save tailored copy
      </Button>
    ) : null;

  const handleShareLink = async () => {
    if (!session?.resumeText.trim()) return;
    setError(null);
    try {
      await copyShareLink({
        name: activeVersion?.name ?? "Resume",
        resumeText: session.resumeText,
      });
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setError("Could not copy share link. Try again or check clipboard permissions.");
    }
  };

  const handleExportPdf = () => {
    if (!session?.resumeText.trim()) return;
    const name =
      getVersion(session.activeVersionId ?? "")?.name ?? "resutail-resume";
    exportResumePdf(
      resumeTextForExport(session.resumeText),
      `${name.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      templateId,
      templateSettings,
    );
  };

  const handleExportDocx = () => {
    if (!session?.resumeText.trim()) return;
    const name =
      getVersion(session.activeVersionId ?? "")?.name ?? "resutail-resume";
    void exportResumeDocx(
      resumeTextForExport(session.resumeText),
      `${name.replace(/\s+/g, "-").toLowerCase()}.docx`,
      templateId,
      templateSettings,
    );
  };

  const atsOverview = useMemo(() => {
    if (!session?.resumeText || !session.atsResult) return undefined;
    if (mode !== "checks" && isDesktop) return undefined;
    return getAtsSiteOverview(session.resumeText, session.atsResult);
  }, [session, mode, isDesktop]);

  const skillMappings = useMemo(() => {
    if (!session?.parsedJD || !session.bullets.length) return [];
    return mapSkillsToResume(session.bullets, session.parsedJD);
  }, [session]);

  const trimSuggestions = useMemo(() => {
    if (!session?.resumeText.trim()) return [];
    return suggestTrim(session.resumeText, 1, templateId, templateSettings);
  }, [session, templateId, templateSettings]);

  const previewResumeText = useDebouncedValue(
    session ? resumeTextForExport(session.resumeText) : "",
    PREVIEW_DEBOUNCE_MS,
  );

  const activeVersion = session?.activeVersionId
    ? getVersion(session.activeVersionId)
    : undefined;
  const baseText = activeVersion?.baseText ?? "";

  const errorAlert = error ? (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null;

  const reviewCount = useMemo(
    () => session?.bullets.filter((b) => b.suggestion).length ?? 0,
    [session?.bullets],
  );

  const libraryPanel = session ? (
    <ContentLibraryPanel
      key={libraryKey}
      sections={sections}
      parsedJD={session.parsedJD}
      activeVersionId={session.activeVersionId}
      resumeText={session.resumeText}
      onAddToResume={handleAddBlockToResume}
      onAddBlocksToResume={handleAddBlocksToResume}
      onApplyProfileToResume={handleApplyProfileToResume}
      onLibraryChange={() => setLibraryKey((k) => k + 1)}
      enableDrag={isDesktop}
    />
  ) : null;

  const coverLetterPanel = session ? (
    <CoverLetterPanel
      resumeText={session.resumeText}
      parsedJD={session.parsedJD}
      jdText={session.jdText}
      letterText={session.coverLetterText}
      tone={session.coverLetterTone}
      templateId={session.coverLetterTemplate}
      onLetterChange={(coverLetterText) => persistDraft({ ...session, coverLetterText })}
      onToneChange={(coverLetterTone) => persist({ ...session, coverLetterTone })}
      onTemplateChange={(coverLetterTemplate) =>
        persist({ ...session, coverLetterTemplate })
      }
      onError={setError}
    />
  ) : null;

  const livePreview = session ? (
    <TemplatePreview
      resumeText={previewResumeText}
      templateId={templateId}
      settings={templateSettings}
    />
  ) : null;

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <>
        <MobileWorkspaceShell
          versionSwitcher={
            <VersionHeaderSwitcher
              versions={allVersions}
              activeVersionId={session.activeVersionId}
            />
          }
          matchScore={session.matchScore?.overall ?? null}
          saveLabel={saveLabel}
          activeMode={mode}
          onModeChange={handleMobileModeChange}
          onExport={handleExportPdf}
          onPreview={() => setPreviewOpen(true)}
          onShare={() => void handleShareLink()}
          exportDisabled={!session.resumeText.trim()}
          previewDisabled={!session.resumeText.trim()}
          shareDisabled={!session.resumeText.trim()}
          shareLabel={shareCopied ? "Link copied" : "Copy share link"}
        >
        <div className="space-y-4">
          {errorAlert}

          {mode === "edit" && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="min-h-11 w-full"
                onClick={() => setLibrarySheetOpen(true)}
              >
                <Library className="size-4" />
                Content library
              </Button>
              <ResumeEditorPanel
              sections={sections}
              rawText={session.resumeText}
              onRawTextChange={handleResumeTextChange}
              onSectionItemChange={handleSectionItemChange}
              onSectionItemReorder={handleSectionItemReorder}
              onSectionItemDrop={handleSectionItemDrop}
              onFileExtracted={handleFileExtracted}
            />
              {importHealth && (
                <ImportHealthStrip
                  report={importHealth}
                  onApplyAtsTemplate={handleApplyAtsTemplate}
                />
              )}
            </div>
          )}

          {mode === "tailor" && (
            <div className="space-y-3">
              <PasteClipboardButton
                onPaste={(text) => persistDraft({ ...session, jdText: text })}
              />
              <JdInsightsPanel
                jdText={session.jdText}
                onJdTextChange={(jdText) => persistDraft({ ...session, jdText })}
                parsedJD={session.parsedJD}
                coverage={session.coverage}
                skillMappings={skillMappings}
                onAnalyze={handleAnalyzeJd}
                analyzing={analyzing}
                onAddSkill={handleAddSkillConfirm}
                onFocusBullet={handleFocusBullet}
              />
              {session.matchScore && (
                <Button
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={() => setMode("checks")}
                >
                  View match score ({session.matchScore.overall}%)
                </Button>
              )}
              {saveTailoredButton}
            </div>
          )}

          {mode === "checks" && (
            <div className="space-y-3">
              <ChecksPanel
                matchScore={session.matchScore}
                atsOverview={atsOverview}
                trimSuggestions={trimSuggestions}
                skillMappings={skillMappings}
                onFocusBullet={handleFocusBullet}
                onGoReview={() => handleMoreSectionChange("review")}
              />
              <ApplicationHistoryPanel
                key={historyKey}
                versionId={session.activeVersionId}
                onRefresh={() => setHistoryKey((k) => k + 1)}
              />
              {saveTailoredButton}
              <Button className="min-h-11 w-full" onClick={() => setMode("edit")}>
                Edit resume
              </Button>
              {!session.parsedJD && (
                <Button
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={() => setMode("tailor")}
                >
                  Add job description
                </Button>
              )}
              {session.parsedJD && session.bullets.length > 0 && (
                <Button
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={() => handleMoreSectionChange("review")}
                >
                  Review AI suggestions
                  {reviewCount > 0 ? ` (${reviewCount})` : ""}
                </Button>
              )}
            </div>
          )}

          {(mode === "customize" || mode === "review") && (
            <div className="space-y-4">
              <MobileMoreNav
                active={mode === "review" ? "review" : moreSection}
                onChange={handleMoreSectionChange}
                reviewCount={reviewCount}
              />

              {(mode === "customize" && moreSection === "style") && (
                <CustomizePanel
                  resumeText={session.resumeText}
                  selectedTemplateId={templateId}
                  onTemplateSelect={handleTemplateSelect}
                  settings={templateSettings}
                  onSettingsChange={handleTemplateSettingsChange}
                  showPreview={false}
                />
              )}

              {mode === "review" && session && (
                <ReviewPanel
                  bullets={session.bullets}
                  hasJd={Boolean(session.parsedJD)}
                  tailoringId={tailoringId}
                  focusBulletId={focusBulletId}
                  onTailor={tailorBullet}
                  onAccept={acceptSuggestion}
                  onReject={rejectSuggestion}
                  onRestore={restoreOriginal}
                  onEditSuggestion={editSuggestion}
                />
              )}

              {moreSection === "letter" && mode === "customize" && coverLetterPanel}

              {mode === "customize" && (
                <>
                  <BaseDiffPanel
                    baseText={baseText}
                    currentText={session.resumeText}
                    versionName={activeVersion?.name}
                  />
                  <Button
                    variant="outline"
                    className="min-h-11 w-full"
                    onClick={handleExportDocx}
                    disabled={!session.resumeText.trim()}
                  >
                    <Download className="size-4" />
                    Export DOCX
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 w-full text-destructive"
                    onClick={handleClearData}
                  >
                    <Trash2 className="size-4" />
                    Clear all data
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </MobileWorkspaceShell>
        <PreviewBottomSheet
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          resumeText={resumeTextForExport(session.resumeText)}
          templateId={templateId}
          settings={templateSettings}
        />
        <ContentLibrarySheet
          open={librarySheetOpen}
          onClose={() => setLibrarySheetOpen(false)}
        >
          {libraryPanel}
        </ContentLibrarySheet>
      </>
    );
  }

  return (
    <DesktopWorkspaceShell
      activeMode={mode}
      onModeChange={setMode}
      header={
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Tailoring workspace</h1>
              <p className="text-sm text-muted-foreground">
                Import, compare, edit, and optimize — AI assists only when you ask.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={!session.resumeText.trim()}
              >
                <Download className="size-3.5" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDocx}
                disabled={!session.resumeText.trim()}
              >
                <Download className="size-3.5" />
                Export DOCX
              </Button>
              <Button
            variant="outline"
            size="sm"
            onClick={() => void handleShareLink()}
            disabled={!session.resumeText.trim()}
            title="Copy view-only share link"
          >
            <Link2 className="size-3.5" />
            {shareCopied ? "Copied" : "Share"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearData}>
                <Trash2 className="size-3.5" />
                Clear data
              </Button>
            </div>
          </div>

          <VersionPicker
            key={versionKey}
            activeVersionId={session.activeVersionId}
            onSelect={(v) => {
              router.push(`/app/v/${v.id}?mode=edit`);
            }}
            onVersionsChange={() => setVersionKey((k) => k + 1)}
          />

          {errorAlert}
        </>
      }
      panel={
        <>
          {mode === "edit" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {libraryPanel}
              <div className="space-y-3">
                <ResumeEditorPanel
                  sections={sections}
                  rawText={session.resumeText}
                  onRawTextChange={handleResumeTextChange}
                  onSectionItemChange={handleSectionItemChange}
                  onSectionItemReorder={handleSectionItemReorder}
                  onSectionItemDrop={handleSectionItemDrop}
                  onFileExtracted={handleFileExtracted}
                  onLibraryBlockDrop={handleLibraryBlockDrop}
                />
                {importHealth && (
                  <ImportHealthStrip
                    report={importHealth}
                    onApplyAtsTemplate={handleApplyAtsTemplate}
                  />
                )}
              </div>
            </div>
          )}

          {mode === "customize" && (
            <div className="space-y-4">
              <CustomizePanel
                resumeText={session.resumeText}
                selectedTemplateId={templateId}
                onTemplateSelect={handleTemplateSelect}
                settings={templateSettings}
                onSettingsChange={handleTemplateSettingsChange}
                showPreview={false}
              />
              {coverLetterPanel}
            </div>
          )}

          {mode === "tailor" && (
            <div className="space-y-4">
              <JdInsightsPanel
                jdText={session.jdText}
                onJdTextChange={(jdText) => persistDraft({ ...session, jdText })}
                parsedJD={session.parsedJD}
                coverage={session.coverage}
                skillMappings={skillMappings}
                onAnalyze={handleAnalyzeJd}
                analyzing={analyzing}
                onAddSkill={handleAddSkillConfirm}
                onFocusBullet={handleFocusBullet}
              />
              {saveTailoredButton}
            </div>
          )}

          {mode === "checks" && (
            <div className="space-y-4">
              <ChecksPanel
                matchScore={session.matchScore}
                atsOverview={atsOverview}
                trimSuggestions={trimSuggestions}
                skillMappings={skillMappings}
                onFocusBullet={handleFocusBullet}
                onGoReview={() => setMode("review")}
              />
              <ApplicationHistoryPanel
                key={historyKey}
                versionId={session.activeVersionId}
                onRefresh={() => setHistoryKey((k) => k + 1)}
              />
              <BaseDiffPanel
                baseText={baseText}
                currentText={session.resumeText}
                versionName={activeVersion?.name}
              />
              {saveTailoredButton}
            </div>
          )}

          {mode === "review" && session && (
            <ReviewPanel
              bullets={session.bullets}
              hasJd={Boolean(session.parsedJD)}
              tailoringId={tailoringId}
              focusBulletId={focusBulletId}
              onTailor={tailorBullet}
              onAccept={acceptSuggestion}
              onReject={rejectSuggestion}
              onRestore={restoreOriginal}
              onEditSuggestion={editSuggestion}
            />
          )}
        </>
      }
      preview={livePreview}
    />
  );
}

function buildResumeFromBullets(bullets: ResumeBullet[], fallback: string): string {
  const sections = new Map<string, string[]>();
  for (const b of bullets) {
    const list = sections.get(b.section) ?? [];
    list.push(b.currentText);
    sections.set(b.section, list);
  }
  const parts: string[] = [];
  for (const [section, items] of sections) {
    parts.push(section.toUpperCase());
    items.forEach((bullet) => parts.push(`• ${bullet}`));
    parts.push("");
  }
  return parts.join("\n").trim() || fallback;
}
