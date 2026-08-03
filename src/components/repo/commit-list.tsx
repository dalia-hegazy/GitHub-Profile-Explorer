import Link from "next/link";

import { formatRelativeDate } from "@/lib/format";
import type { GithubCommit } from "@/lib/github";

interface CommitListProps {
  commits: GithubCommit[];
  owner: string;
  repo: string;
}

export function CommitList({ commits, owner, repo }: CommitListProps) {
  return (
    <section aria-label="Recent commits" className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">Recent commits</h2>
      {commits.length === 0 ? (
        <p className="text-muted-foreground">No commits found.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border">
          {commits.map((commit) => (
            <li key={commit.sha} className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  <Link
                    href={commit.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {commit.message.split("\n")[0]}
                  </Link>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Link
                    href={`/u/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}
                    className="text-primary hover:underline"
                  >
                    {owner}
                  </Link>
                  {commit.authorLogin ? (
                    <>
                      {" "}
                      committed by {commit.authorLogin}
                    </>
                  ) : null}
                  {" · "}
                  {formatRelativeDate(commit.committedAt)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {commit.sha.slice(0, 7)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
