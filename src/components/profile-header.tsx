import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatJoinDate } from "@/lib/format";
import type { GithubUser } from "@/lib/github";

interface ProfileHeaderProps {
  user: GithubUser;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const displayName = user.name ?? user.login;
  const joinedLabel = formatJoinDate(user.createdAt);

  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <Image
        src={user.avatarUrl}
        alt={`${user.login} avatar`}
        width={96}
        height={96}
        className="size-24 shrink-0 rounded-full border border-border"
        priority
      />
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <span className="text-muted-foreground">@{user.login}</span>
          {user.type === "Organization" ? <Badge variant="secondary">Organization</Badge> : null}
        </div>
        {user.bio ? <p className="text-muted-foreground">{user.bio}</p> : null}

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(user.followers)}
            </strong>{" "}
            followers
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(user.following)}
            </strong>{" "}
            following
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {formatCompactNumber(user.publicRepos)}
            </strong>{" "}
            repositories
          </span>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {user.location ? <li>{user.location}</li> : null}
          {user.company ? <li>{user.company}</li> : null}
          {user.blog ? (
            <li>
              <Link
                href={user.blog}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {user.blog}
              </Link>
            </li>
          ) : null}
          <li>Joined {joinedLabel}</li>
        </ul>

        <p className="text-sm">
          <Link
            href={user.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on GitHub
          </Link>
        </p>
      </div>
    </section>
  );
}
