"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/;

interface CompareFormProps {
  defaultUserA?: string;
  defaultUserB?: string;
}

export function CompareForm({ defaultUserA = "", defaultUserB = "" }: CompareFormProps) {
  const router = useRouter();
  const [userA, setUserA] = useState(defaultUserA);
  const [userB, setUserB] = useState(defaultUserB);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const a = userA.trim();
    const b = userB.trim();
    if (!a || !b) {
      setError("Please enter two GitHub usernames.");
      return;
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      setError("Please choose two different users.");
      return;
    }
    if (
      a.length > 39 ||
      b.length > 39 ||
      !GITHUB_USERNAME_PATTERN.test(a) ||
      !GITHUB_USERNAME_PATTERN.test(b)
    ) {
      setError("GitHub usernames may only contain letters, numbers, and hyphens.");
      return;
    }
    setError(null);
    router.push(`/compare?u1=${encodeURIComponent(a)}&u2=${encodeURIComponent(b)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2" noValidate>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Input
          type="search"
          value={userA}
          onChange={(event) => setUserA(event.target.value)}
          placeholder="First username, e.g. octocat"
          aria-label="First GitHub username"
          aria-invalid={error !== null}
          className="flex-1"
        />
        <Input
          type="search"
          value={userB}
          onChange={(event) => setUserB(event.target.value)}
          placeholder="Second username, e.g. torvalds"
          aria-label="Second GitHub username"
          aria-invalid={error !== null}
          className="flex-1"
        />
        <Button type="submit">Compare</Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
