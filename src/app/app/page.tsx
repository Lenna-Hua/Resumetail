import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { VersionsDashboard } from "@/components/versions-dashboard";

export const metadata: Metadata = {
  title: "App — ResuTail",
  description: "Your resume versions — tailor and export for any job posting.",
};

export default function AppPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <VersionsDashboard />
      </main>
    </>
  );
}
