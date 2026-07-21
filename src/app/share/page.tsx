import type { Metadata } from "next";
import { Suspense } from "react";
import { ShareView } from "@/components/share-view";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Shared resume — ResuTail",
  description: "View-only shared resume from ResuTail.",
  robots: { index: false, follow: false },
};

function ShareFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function SharePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Suspense fallback={<ShareFallback />}>
        <ShareView />
      </Suspense>
    </main>
  );
}
