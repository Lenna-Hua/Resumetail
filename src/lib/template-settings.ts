import type { ResumeTemplateId, TemplateSettings } from "@/lib/resume-template-types";
import { DEFAULT_ATS_FONT, isAtsFont } from "@/lib/ats-fonts";
import { getTemplate } from "@/lib/resume-templates";
import { getLocalItem, setLocalItem } from "@/lib/browser-store";

const SETTINGS_KEY = "resutail-template-settings-v1";

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  accentColor: "#1a1a1a",
  marginScale: 1,
  spacingScale: 1,
  fontFamily: DEFAULT_ATS_FONT,
};

export const ACCENT_COLOR_PRESETS = [
  { label: "Black", value: "#1a1a1a" },
  { label: "Navy", value: "#1e3a5f" },
  { label: "Teal", value: "#0f766e" },
  { label: "Burgundy", value: "#7f1d1d" },
  { label: "Slate", value: "#334155" },
];

export function loadTemplateSettings(templateId?: ResumeTemplateId): TemplateSettings {
  if (typeof window === "undefined") {
    return templateId
      ? { ...DEFAULT_TEMPLATE_SETTINGS, accentColor: getTemplate(templateId).defaultAccentColor }
      : DEFAULT_TEMPLATE_SETTINGS;
  }

  try {
    const raw = getLocalItem(SETTINGS_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<TemplateSettings>) : {};
    const accentColor =
      stored.accentColor ??
      (templateId ? getTemplate(templateId).defaultAccentColor : DEFAULT_TEMPLATE_SETTINGS.accentColor);

    return {
      accentColor,
      marginScale: stored.marginScale ?? DEFAULT_TEMPLATE_SETTINGS.marginScale,
      spacingScale: stored.spacingScale ?? DEFAULT_TEMPLATE_SETTINGS.spacingScale,
      fontFamily: isAtsFont(stored.fontFamily)
        ? stored.fontFamily
        : DEFAULT_TEMPLATE_SETTINGS.fontFamily,
    };
  } catch {
    return DEFAULT_TEMPLATE_SETTINGS;
  }
}

export function saveTemplateSettings(settings: TemplateSettings): void {
  if (typeof window === "undefined") return;
  setLocalItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resolveTemplateSettings(
  templateId: ResumeTemplateId,
  overrides?: Partial<TemplateSettings>,
): TemplateSettings {
  const base = loadTemplateSettings(templateId);
  const template = getTemplate(templateId);

  return {
    accentColor: overrides?.accentColor ?? base.accentColor ?? template.defaultAccentColor,
    marginScale: overrides?.marginScale ?? base.marginScale,
    spacingScale: overrides?.spacingScale ?? base.spacingScale,
    fontFamily: overrides?.fontFamily ?? base.fontFamily ?? DEFAULT_ATS_FONT,
  };
}
