"use client";

import { StorageInit } from "@/components/storage-init";
import { KeyboardInsetProvider } from "@/components/keyboard-inset-provider";
import { AuthProvider } from "@/components/auth-provider";
import { FirstTimeWelcome } from "@/components/first-time-welcome";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StorageInit />
      <KeyboardInsetProvider />
      <FirstTimeWelcome />
      {children}
    </AuthProvider>
  );
}
