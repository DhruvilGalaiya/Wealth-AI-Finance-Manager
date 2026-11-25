"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

// Clerk's card follows the app's light/dark theme.
function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  return {
    baseTheme: resolvedTheme === "dark" ? dark : undefined,
    variables: { colorPrimary: resolvedTheme === "dark" ? "#2fbfa5" : "#16695f", borderRadius: "0.75rem" },
    elements: { card: "shadow-xl", rootBox: "w-full max-w-sm" },
  };
}

export function ThemedSignIn() {
  return <SignIn appearance={useClerkAppearance()} />;
}

export function ThemedSignUp() {
  return <SignUp appearance={useClerkAppearance()} />;
}
