"use client";

import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !user || user.role !== "admin") {
    router.replace("/login");
    return null;
  }

  return <>{children}</>;
}
