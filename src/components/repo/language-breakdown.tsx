import type { RepoLanguages } from "@/lib/github";

interface LanguageBreakdownProps {
  languages: RepoLanguages;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Lua: "#000080",
  R: "#198CE7",
  Solidity: "#AA6746",
};

function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? "#8b949e";
}

export function LanguageBreakdown({ languages }: LanguageBreakdownProps) {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);

  if (total === 0) {
    return null;
  }

  const entries = Object.entries(languages)
    .map(([name, bytes]) => ({ name, bytes, percentage: (bytes / total) * 100 }))
    .sort((a, b) => b.bytes - a.bytes);

  return (
    <section aria-label="Languages" className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">Languages</h2>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {entries.map((entry) => (
          <div
            key={entry.name}
            style={{
              width: `${entry.percentage}%`,
              backgroundColor: languageColor(entry.name),
            }}
            title={entry.name}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {entries.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{ backgroundColor: languageColor(entry.name) }}
            />
            <span>{entry.name}</span>
            <span className="text-muted-foreground">
              {entry.percentage >= 10
                ? `${Math.round(entry.percentage)}%`
                : `${entry.percentage.toFixed(1)}%`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
