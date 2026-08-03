import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCompactNumber, formatRelativeDate } from "@/lib/format";
import type { GithubRepo } from "@/lib/github";

interface RepoDetailHeaderProps {
  repo: GithubRepo;
}

export function RepoDetailHeader({ repo }: RepoDetailHeaderProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/u/${encodeURIComponent(repo.ownerLogin)}`}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            {repo.ownerLogin}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-2xl font-bold tracking-tight">{repo.name}</h1>
        </div>
        {repo.description ? (
          <p className="text-muted-foreground">{repo.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(repo.stargazersCount)}
            </strong>{" "}
            stars
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(repo.forksCount)}
            </strong>{" "}
            forks
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(repo.watchersCount)}
            </strong>{" "}
            watchers
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(repo.openIssuesCount)}
            </strong>{" "}
            open issues
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {repo.language ? <Badge variant="secondary">{repo.language}</Badge> : null}
          {repo.license ? <Badge variant="outline">{repo.license}</Badge> : null}
          {repo.fork ? <Badge variant="outline">fork</Badge> : null}
          {repo.homepage ? (
            <Badge variant="outline" className="rounded-md">
              <Link href={repo.homepage} target="_blank" rel="noopener noreferrer">
                {repo.homepage}
              </Link>
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>Default branch: {repo.defaultBranch}</span>
          <span>Updated {formatRelativeDate(repo.pushedAt ?? repo.updatedAt)}</span>
        </div>

        {repo.topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {repo.topics.map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
        ) : null}

        <p className="text-sm">
          <Link
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on GitHub
          </Link>
        </p>
      </div>
    </Card>
  );
}
