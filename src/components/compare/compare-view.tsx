import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/format";
import type { UserStats } from "@/lib/github";

interface CompareViewProps {
  statsA: UserStats;
  statsB: UserStats;
}

interface MetricRow {
  label: string;
  getValue: (stats: UserStats) => number;
  format?: (value: number) => string;
}

const METRICS: MetricRow[] = [
  { label: "Repositories", getValue: (s) => s.reposCount, format: String },
  {
    label: "Followers",
    getValue: (s) => s.followers,
    format: formatCompactNumber,
  },
  {
    label: "Stars received",
    getValue: (s) => s.totalStars,
    format: formatCompactNumber,
  },
  {
    label: "Forks received",
    getValue: (s) => s.totalForks,
    format: formatCompactNumber,
  },
  {
    label: "Commits (last 30 days)",
    getValue: (s) => s.commitsLast30Days,
    format: String,
  },
  {
    label: "Account age (years)",
    getValue: (s) => s.accountAgeYears,
    format: String,
  },
];

function UserMiniCard({ stats }: { stats: UserStats }) {
  const { user } = stats;
  const displayName = user.name ?? user.login;
  return (
    <Card className="p-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src={user.avatarUrl}
          alt={`${user.login} avatar`}
          width={64}
          height={64}
          className="size-16 rounded-full border border-border"
        />
        <div>
          <p className="font-semibold">{displayName}</p>
          <Link
            href={`/u/${encodeURIComponent(user.login)}`}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            @{user.login}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {user.bio ?? `GitHub user ${user.login}.`}
        </p>
        {stats.topLanguage ? <Badge variant="outline">{stats.topLanguage}</Badge> : null}
      </div>
    </Card>
  );
}

function MetricBar({ value, max, label }: { value: number; max: number; label: string }) {
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div
      className="h-2 rounded-full bg-primary"
      style={{ width: `${width}%` }}
      role="img"
      aria-label={`${label}`}
    />
  );
}

export function CompareView({ statsA, statsB }: CompareViewProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <UserMiniCard stats={statsA} />
        <UserMiniCard stats={statsB} />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold tracking-tight">Metric comparison</h2>
        <ul className="space-y-5">
          {METRICS.map((metric) => {
            const valueA = metric.getValue(statsA);
            const valueB = metric.getValue(statsB);
            const max = Math.max(valueA, valueB, 1);
            const format = metric.format ?? String;
            return (
              <li key={metric.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.label}</span>
                  <span className="flex gap-6">
                    <strong className="text-primary">{format(valueA)}</strong>
                    <strong>{format(valueB)}</strong>
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-24 shrink-0 rounded-full bg-muted">
                      <MetricBar value={valueA} max={max} label={`${metric.label} for ${statsA.user.login}`} />
                    </span>
                    <span className="text-xs text-muted-foreground">{statsA.user.login}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-24 shrink-0 rounded-full bg-muted">
                      <MetricBar value={valueB} max={max} label={`${metric.label} for ${statsB.user.login}`} />
                    </span>
                    <span className="text-xs text-muted-foreground">{statsB.user.login}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
