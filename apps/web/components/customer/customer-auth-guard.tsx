"use client";

import { useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";

export function CustomerAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !user || user.role !== "customer") {
    router.replace("/login/customer");
    return null;
  }

  return <>{children}</>;
}
