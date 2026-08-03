"use client";

import { Button } from "@/components/ui/button";
import { GithubError } from "@/lib/github/errors";

interface RepoPageErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function RepoPageError({ error, unstable_retry }: RepoPageErrorProps) {
  const message =
    error instanceof GithubError && error.code === "rate_limited"
      ? "GitHub API rate limit exceeded. Please wait a moment and try again."
      : "Something went wrong while loading this repository.";

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h2 className="text-2xl font-bold tracking-tight">Unable to load repository</h2>
      <p className="mt-4 text-muted-foreground">{message}</p>
      <Button onClick={() => unstable_retry()} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
