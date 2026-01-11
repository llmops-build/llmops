import { createFileRoute } from '@tanstack/react-router';

const DISCORD_INVITE_URL = 'https://discord.gg/8teSTfmEKU';

export const Route = createFileRoute('/discord')({
  server: {
    handlers: {
      GET: async () => {
        return new Response(null, {
          status: 302,
          headers: {
            Location: DISCORD_INVITE_URL,
          },
        });
      },
    },
  },
});
