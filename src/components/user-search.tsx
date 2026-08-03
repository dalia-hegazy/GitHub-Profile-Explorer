"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/;

export function UserSearch() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = username.trim();
    if (value.length === 0) {
      setError("Please enter a GitHub username.");
      return;
    }
    if (value.length > 39 || !GITHUB_USERNAME_PATTERN.test(value)) {
      setError("GitHub usernames may only contain letters, numbers, and hyphens.");
      return;
    }
    setError(null);
    router.push(`/u/${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2" noValidate>
      <div className="flex w-full gap-2">
        <Input
          type="search"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. octocat"
          aria-label="GitHub username"
          aria-invalid={error !== null}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
