import { createFileRoute } from "@tanstack/react-router";

const GITHUB_URL = "https://github.com/llmops-build/llmops";

export const Route = createFileRoute("/github")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(null, {
          status: 302,
          headers: {
            Location: GITHUB_URL,
          },
        });
      },
    },
  },
});
