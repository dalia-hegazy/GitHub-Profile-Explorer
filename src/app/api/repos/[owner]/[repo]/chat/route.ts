import { z } from "zod";

import { streamRepoChat } from "@/lib/ai/chat";
import { NoAiProviderConfiguredError } from "@/lib/ai/provider";
import { GithubError } from "@/lib/github";

export const runtime = "nodejs";

const ownerSchema = z
  .string()
  .trim()
  .min(1, "Missing repository owner.")
  .max(39)
  .regex(/^[a-zA-Z0-9-]+$/, "Invalid repository owner.");
const repoSchema = z
  .string()
  .trim()
  .min(1, "Missing repository name.")
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/, "Invalid repository name.");

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1, "Message cannot be empty.").max(4000),
      }),
    )
    .min(1, "At least one message is required.")
    .max(50, "Too many messages."),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ owner: string; repo: string }> },
): Promise<Response> {
  const { owner, repo } = await context.params;

  const ownerParsed = ownerSchema.safeParse(owner);
  const repoParsed = repoSchema.safeParse(repo);
  if (!ownerParsed.success || !repoParsed.success) {
    return Response.json(
      { error: "Invalid repository identifier." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request body.";
    return Response.json({ error: message }, { status: 400 });
  }

  const lastMessage = parsed.data.messages.at(-1);
  if (lastMessage?.role !== "user") {
    return Response.json(
      { error: "The last message must be from the user." },
      { status: 400 },
    );
  }

  try {
    return await streamRepoChat({
      owner: ownerParsed.data,
      repo: repoParsed.data,
      messages: parsed.data.messages,
    });
  } catch (error) {
    if (error instanceof NoAiProviderConfiguredError) {
      return Response.json(
        { error: "AI chat is not configured. Set an AI provider API key." },
        { status: 503 },
      );
    }
    if (error instanceof GithubError && error.code === "not_found") {
      return Response.json({ error: "Repository not found." }, { status: 404 });
    }
    if (error instanceof GithubError && error.code === "rate_limited") {
      return Response.json(
        { error: "GitHub API rate limit reached. Try again later." },
        { status: 429 },
      );
    }
    return Response.json({ error: "Failed to start the chat stream." }, { status: 500 });
  }
}
