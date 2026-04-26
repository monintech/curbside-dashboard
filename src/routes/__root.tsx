import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import appCss from "../styles.css?url";
import { BottomNav } from "@/components/bottom-nav";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Curbside Dashboard" },
      { name: "description", content: "Real estate lead capture dashboard" },
      { name: "theme-color", content: "#2563eb" },
      { property: "og:title", content: "Curbside Dashboard" },
      { property: "og:description", content: "Real estate lead capture dashboard" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Curbside Dashboard" },
      { name: "twitter:description", content: "Real estate lead capture dashboard" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c25cb59a-26fe-4b5d-8ae8-1f2ca537e9ed/id-preview-afe9092a--27bd864d-797e-4258-b1f6-76c198dde64a.lovable.app-1777179701524.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c25cb59a-26fe-4b5d-8ae8-1f2ca537e9ed/id-preview-afe9092a--27bd864d-797e-4258-b1f6-76c198dde64a.lovable.app-1777179701524.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={qc}>
      <div className="mx-auto min-h-screen max-w-2xl bg-background pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </QueryClientProvider>
  );
}
