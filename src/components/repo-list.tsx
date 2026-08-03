import { RepoCard } from "@/components/repo-card";
import { RepoPagination } from "@/components/repo-pagination";
import type { ReposPage } from "@/lib/github";

interface RepoListProps {
  username: string;
  reposPage: ReposPage;
}

export function RepoList({ username, reposPage }: RepoListProps) {
  const { repos, page, hasNextPage } = reposPage;

  return (
    <section aria-label="Repositories" className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">Repositories</h2>
      {repos.length === 0 ? (
        <p className="text-muted-foreground">This user has no public repositories.</p>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

      <RepoPagination username={username} page={page} hasNextPage={hasNextPage} />
    </section>
  );
}
