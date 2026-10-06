import { FileText } from "lucide-react";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Link href="/" className="flex items-center justify-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </span>
          ResuTail
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Optional — keep resumes, library, and versions synced across devices. Local guest use
              still works without an account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuthForm mode="sign-up" redirectTo={redirectTo} />
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/app" className="font-medium text-foreground underline-offset-4 hover:underline">
                Continue as guest
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
