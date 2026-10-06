"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

const CredentialsSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  password: z.string().min(6, { error: "Password must be at least 6 characters." }),
});

export interface AuthFormState {
  error?: string;
  message?: string;
}

export async function signIn(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Invalid credentials." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);
  if (error) {
    return { error: error.message };
  }

  const redirectTo = formData.get("redirectTo");
  redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/app");
}

export async function signUp(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(validated.data);
  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      message: "Account created. Check your email to confirm your address, then sign in.",
    };
  }

  redirect("/app");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
