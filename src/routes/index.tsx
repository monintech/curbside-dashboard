import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Curbside Dashboard
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your blank canvas — start building.
        </p>
      </div>
    </main>
  );
}
