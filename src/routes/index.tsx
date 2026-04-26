import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <h1 className="text-4xl font-bold text-foreground">Curbside Dashboard</h1>
    </main>
  );
}
