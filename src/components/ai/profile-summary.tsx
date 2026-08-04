import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/components/markdown-content";
import { getUser, getUserRepos } from "@/lib/github";
import type { ProfileSummaryContext } from "@/lib/ai/summary";
import { ProfileSummaryError, generateProfileSummary } from "@/lib/ai/summary";
import { NoAiProviderConfiguredError } from "@/lib/ai/provider";

interface ProfileSummaryProps {
  username: string;
}

async function buildContext(username: string): Promise<ProfileSummaryContext> {
  const [user, reposPage] = await Promise.all([
    getUser(username),
    getUserRepos(username, { perPage: 10, sort: "stars" }),
  ]);

  const topRepos = reposPage.repos.slice(0, 5).map((repo) => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stargazersCount: repo.stargazersCount,
    forksCount: repo.forksCount,
    topics: repo.topics,
    homepage: repo.homepage,
  }));

  return {
    user: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      followers: user.followers,
      following: user.following,
      publicRepos: user.publicRepos,
      createdAt: user.createdAt,
    },
    topRepos,
  };
}

export async function ProfileSummary({ username }: ProfileSummaryProps) {
  let summary: string;

  try {
    const context = await buildContext(username);
    summary = await generateProfileSummary(context);
  } catch (error) {
    if (error instanceof NoAiProviderConfiguredError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>AI summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI summaries are unavailable. Set{" "}
              <code>OPENAI_API_KEY</code>, <code>GOOGLE_GENERATIVE_AI_API_KEY</code>, or{" "}
              <code>ANTHROPIC_API_KEY</code> to enable them.
            </p>
          </CardContent>
        </Card>
      );
    }
    if (error instanceof ProfileSummaryError) {
      const description = error.isRateLimited
        ? "The AI service is temporarily at its request limit."
        : "Could not generate a summary right now.";
      return (
        <Card>
          <CardHeader>
            <CardTitle>AI summary</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      );
    }
    throw error;
  }

  return (
    <section aria-label="AI summary" className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">AI summary</h2>
      <Card className="p-6">
        <MarkdownContent
          content={summary}
          className="prose prose-sm max-w-none dark:prose-invert"
        />
      </Card>
    </section>
  );
}

export function ProfileSummarySkeleton() {
  return (
    <section aria-label="AI summary" className="space-y-3">
      <div className="h-7 w-32 animate-pulse rounded bg-muted" />
      <Card className="space-y-3 p-6">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </Card>
    </section>
  );
}
