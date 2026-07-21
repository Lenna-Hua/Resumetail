import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { CreateResumePage } from "@/components/create-resume-page";

export const metadata: Metadata = {
  title: "New resume — ResuTail",
  description: "Import, paste, or assemble a resume from your content library.",
};

function CreateFallback() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default function NewResumePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<CreateFallback />}>
          <CreateResumePage />
        </Suspense>
      </main>
    </>
  );
}
