import type { Metadata } from "next";
import { Suspense } from "react";
import { TailoringWorkspace } from "@/components/tailoring-workspace";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Workspace — ResuTail",
  description: "Edit, tailor, and optimize your resume for a target job.",
};

function WorkspaceFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default async function VersionWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex-1">
      <Suspense fallback={<WorkspaceFallback />}>
        <TailoringWorkspace versionId={id} />
      </Suspense>
    </main>
  );
}
