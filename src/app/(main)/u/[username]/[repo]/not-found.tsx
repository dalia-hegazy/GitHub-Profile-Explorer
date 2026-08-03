import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function RepoNotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Repository not found</h1>
      <p className="mt-4 text-muted-foreground">
        We could not find that repository, or it may be private.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Search another user
      </Link>
    </section>
  );
}
