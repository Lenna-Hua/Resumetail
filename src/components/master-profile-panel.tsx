"use client";

import { useState } from "react";
import type { MasterProfile } from "@/lib/types";
import {
  applyMasterProfileToResumeText,
  extractMasterProfileFromResume,
  hasMasterProfile,
  loadMasterProfile,
  saveMasterProfile,
} from "@/lib/master-profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, ChevronDown, ChevronUp } from "lucide-react";

interface MasterProfilePanelProps {
  resumeText?: string;
  onApplyToResume?: (text: string) => void;
  onSaved?: () => void;
}

export function MasterProfilePanel({
  resumeText,
  onApplyToResume,
  onSaved,
}: MasterProfilePanelProps) {
  const [open, setOpen] = useState(() => hasMasterProfile(loadMasterProfile()));
  const [profile, setProfile] = useState<MasterProfile>(() => loadMasterProfile());
  const [saved, setSaved] = useState(false);

  const updateField = (field: keyof Omit<MasterProfile, "updatedAt">, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveMasterProfile(profile);
    setSaved(true);
    onSaved?.();
  };

  const handleExtract = () => {
    if (!resumeText?.trim()) return;
    const extracted = extractMasterProfileFromResume(resumeText);
    setProfile((prev) => ({
      ...prev,
      ...extracted,
      updatedAt: prev.updatedAt,
    }));
    setSaved(false);
    setOpen(true);
  };

  const handleApply = () => {
    if (!onApplyToResume || !resumeText?.trim()) return;
    saveMasterProfile(profile);
    onApplyToResume(applyMasterProfileToResumeText(resumeText, profile));
    setSaved(true);
  };

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <User className="size-4 text-muted-foreground" />
          Master profile
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {open && (
        <div className="space-y-3 border-t px-3 py-3">
          <p className="text-xs text-muted-foreground">
            Contact details saved once — reused across resume versions, separate from content
            blocks.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <ProfileField
              id="profile-name"
              label="Full name"
              value={profile.fullName}
              onChange={(value) => updateField("fullName", value)}
            />
            <ProfileField
              id="profile-email"
              label="Email"
              value={profile.email}
              onChange={(value) => updateField("email", value)}
            />
            <ProfileField
              id="profile-phone"
              label="Phone"
              value={profile.phone}
              onChange={(value) => updateField("phone", value)}
            />
            <ProfileField
              id="profile-location"
              label="Location"
              value={profile.location}
              onChange={(value) => updateField("location", value)}
            />
            <ProfileField
              id="profile-linkedin"
              label="LinkedIn"
              value={profile.linkedIn}
              onChange={(value) => updateField("linkedIn", value)}
            />
            <ProfileField
              id="profile-portfolio"
              label="Portfolio"
              value={profile.portfolio}
              onChange={(value) => updateField("portfolio", value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleSave}>
              Save profile
            </Button>
            {resumeText?.trim() && (
              <Button type="button" size="sm" variant="outline" onClick={handleExtract}>
                Extract from resume
              </Button>
            )}
            {onApplyToResume && resumeText?.trim() && hasMasterProfile(profile) && (
              <Button type="button" size="sm" variant="outline" onClick={handleApply}>
                Apply to resume
              </Button>
            )}
          </div>

          {saved && <p className="text-xs text-muted-foreground">Profile saved.</p>}
        </div>
      )}
    </div>
  );
}

function ProfileField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring"
      />
    </div>
  );
}
