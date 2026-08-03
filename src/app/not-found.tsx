import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-muted-foreground">This page could not be found.</p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Go home
      </Link>
    </section>
  );
}
