import { Logo } from "@/components/app/logo";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <Logo />
      {children}
    </div>
  );
}
