import { UserSearch } from "@/components/user-search";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">GitHub Profile Explorer</h1>
      <p className="mt-4 text-muted-foreground">
        Search any GitHub username to explore their profile, repositories, and more.
      </p>
      <div className="mt-8 flex w-full justify-center">
        <UserSearch />
      </div>
    </section>
  );
}
