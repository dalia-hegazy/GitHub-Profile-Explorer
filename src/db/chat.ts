import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "./client";
import { chatMessages, type ChatMessage, type ChatRole, type NewChatMessage } from "./schema";
import { DatabaseNotConfiguredError } from "./notes";

export async function getChatHistory(owner: string, repo: string): Promise<ChatMessage[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.owner, owner), eq(chatMessages.repo, repo)))
    .orderBy(asc(chatMessages.createdAt))
    .limit(200);
}

export async function appendChatMessage(
  owner: string,
  repo: string,
  role: ChatRole,
  content: string,
): Promise<ChatMessage> {
  const db = getDb();
  if (!db) throw new DatabaseNotConfiguredError();

  const input: NewChatMessage = { owner, repo, role, content };
  const rows = await db.insert(chatMessages).values(input).returning();
  return rows[0];
}

export async function clearChatHistory(owner: string, repo: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .delete(chatMessages)
    .where(and(eq(chatMessages.owner, owner), eq(chatMessages.repo, repo)));
}

export async function listRecentConversations(limit = 20): Promise<
  Array<{ owner: string; repo: string; lastMessageAt: Date }>
> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      owner: chatMessages.owner,
      repo: chatMessages.repo,
      lastMessageAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
  const seen = new Set<string>();
  const conversations: Array<{ owner: string; repo: string; lastMessageAt: Date }> = [];
  for (const row of rows) {
    const key = `${row.owner}/${row.repo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    conversations.push(row);
  }
  return conversations;
}
