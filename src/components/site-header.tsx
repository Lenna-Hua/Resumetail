"use client";

import { FileText, Shield } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-border/80 bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:px-6 sm:py-0">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </span>
          <span className="truncate">ResuTail</span>
        </Link>

        <div
          className={cn(
            "order-3 flex w-full min-w-0 items-center gap-1.5 text-xs text-muted-foreground",
            "sm:order-none sm:w-auto sm:flex-1 sm:justify-center",
          )}
        >
          <Shield className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate sm:whitespace-normal">
            <span className="sm:hidden">Local-first · optional sync</span>
            <span className="hidden sm:inline">
              Local-first · optional account sync
            </span>
          </span>
        </div>

        <nav className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/templates"
            className="inline-flex min-h-9 items-center justify-center rounded-lg px-2 text-sm font-medium hover:bg-muted sm:px-2.5"
          >
            Templates
          </Link>
          <ButtonLink href="/app" size="sm" className="min-h-9 whitespace-nowrap px-2.5 sm:px-3">
            <span className="sm:hidden">Workspace</span>
            <span className="hidden sm:inline">Open workspace</span>
          </ButtonLink>
          {!loading && user ? (
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="min-h-9 whitespace-nowrap px-2.5 sm:px-3"
              >
                Sign out
              </Button>
            </form>
          ) : (
            <ButtonLink
              href="/sign-in"
              size="sm"
              variant="outline"
              className="min-h-9 whitespace-nowrap px-2.5 sm:px-3"
            >
              Sign in
            </ButtonLink>
          )}
        </nav>
      </div>
    </header>
  );
}
