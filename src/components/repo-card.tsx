import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCompactNumber, formatRelativeDate } from "@/lib/format";
import type { GithubRepo } from "@/lib/github";

interface RepoCardProps {
  repo: GithubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  const updatedAt = repo.pushedAt ?? repo.updatedAt;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            <Link
              href={`/u/${encodeURIComponent(repo.ownerLogin)}/${encodeURIComponent(repo.name)}`}
            >
              {repo.name}
            </Link>
          </h2>
          {repo.fork ? <Badge variant="secondary">fork</Badge> : null}
        </div>
        {repo.description ? (
          <p className="text-sm text-muted-foreground">{repo.description}</p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {repo.language ? (
            <span>
              <span aria-hidden="true" className="mr-1 inline-block size-2.5 rounded-full bg-primary" />
              {repo.language}
            </span>
          ) : null}
          <span aria-label={`${repo.stargazersCount} stars`}>
            {formatCompactNumber(repo.stargazersCount)} stars
          </span>
          <span aria-label={`${repo.forksCount} forks`}>
            {formatCompactNumber(repo.forksCount)} forks
          </span>
          <span>Updated {formatRelativeDate(updatedAt)}</span>
        </div>

        {repo.topics.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {repo.topics.slice(0, 5).map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
