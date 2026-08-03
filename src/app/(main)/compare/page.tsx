import type { Metadata } from "next";

import { CompareForm } from "@/components/compare/compare-form";
import { CompareView } from "@/components/compare/compare-view";
import { GithubError, getUserStats } from "@/lib/github";

export const metadata: Metadata = {
  title: "Compare GitHub users",
  description: "Compare two GitHub users on repositories, followers, stars, and more.",
};

interface ComparePageProps {
  searchParams: Promise<{ u1?: string | string[]; u2?: string | string[] }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolved = await searchParams;
  const rawUserA = resolved.u1;
  const rawUserB = resolved.u2;
  const userA = Array.isArray(rawUserA) ? rawUserA[0] : rawUserA;
  const userB = Array.isArray(rawUserB) ? rawUserB[0] : rawUserB;

  let statsA: Awaited<ReturnType<typeof getUserStats>> | null = null;
  let statsB: Awaited<ReturnType<typeof getUserStats>> | null = null;

  if (userA && userB) {
    try {
      [statsA, statsB] = await Promise.all([
        getUserStats(userA),
        getUserStats(userB),
      ]);
    } catch (error) {
      if (error instanceof GithubError && error.code === "not_found") {
        // Fall through to the form with an inline error for a bad username.
        return (
          <ComparePageShell
            defaultUserA={userA}
            defaultUserB={userB}
            error="One or both GitHub users could not be found."
          />
        );
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Compare users</h1>
        <p className="text-muted-foreground">
          Enter two GitHub usernames to compare their profiles side by side.
        </p>
      </div>
      <CompareForm defaultUserA={userA ?? ""} defaultUserB={userB ?? ""} />
      {statsA && statsB ? <CompareView statsA={statsA} statsB={statsB} /> : null}
    </div>
  );
}

interface ComparePageShellProps {
  defaultUserA: string;
  defaultUserB: string;
  error: string;
}

function ComparePageShell({ defaultUserA, defaultUserB, error }: ComparePageShellProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Compare users</h1>
        <p className="text-muted-foreground">
          Enter two GitHub usernames to compare their profiles side by side.
        </p>
      </div>
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
      <CompareForm defaultUserA={defaultUserA} defaultUserB={defaultUserB} />
    </div>
  );
}
