import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          GitHub Profile Explorer
        </Link>
        <nav aria-label="Primary" className="text-sm text-muted-foreground">
          <Link href="/compare" className="hover:text-foreground hover:underline">
            Compare
          </Link>
        </nav>
      </div>
    </header>
  );
}
