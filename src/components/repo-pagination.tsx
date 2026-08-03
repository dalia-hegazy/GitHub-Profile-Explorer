"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

interface RepoPaginationProps {
  username: string;
  page: number;
  hasNextPage: boolean;
}

export function RepoPagination({ username, page, hasNextPage }: RepoPaginationProps) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
      <Link
        href={`/u/${encodeURIComponent(username)}?page=${page - 1}`}
        className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1" })}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        onClick={(event) => {
          if (page <= 1) event.preventDefault();
        }}
      >
        Previous
      </Link>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Link
        href={`/u/${encodeURIComponent(username)}?page=${page + 1}`}
        className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1" })}
        aria-disabled={!hasNextPage}
        tabIndex={!hasNextPage ? -1 : undefined}
        onClick={(event) => {
          if (!hasNextPage) event.preventDefault();
        }}
      >
        Next
      </Link>
    </nav>
  );
}
