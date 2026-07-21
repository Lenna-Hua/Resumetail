import { BackupNudgeBanner } from "@/components/backup-nudge-banner";
import { SessionStaleBanner } from "@/components/session-stale-banner";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="px-4 pt-4 sm:px-6">
        <SessionStaleBanner />
        <BackupNudgeBanner />
      </div>
      {children}
    </>
  );
}
