import type { NextRequest } from 'next/server';
import { createLLMOpsHandler } from '@llmops/sdk/nextjs';
import { getLLMOpsClient } from '@/llmops';

// Force dynamic rendering to prevent static analysis issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization - only create handler when first request comes in
let handler: ((request: NextRequest) => Promise<Response>) | null = null;

function getHandler() {
  if (!handler) {
    handler = createLLMOpsHandler(getLLMOpsClient());
  }
  return handler;
}

export const GET = (req: NextRequest) => getHandler()(req);
export const POST = (req: NextRequest) => getHandler()(req);
export const PUT = (req: NextRequest) => getHandler()(req);
export const DELETE = (req: NextRequest) => getHandler()(req);
export const PATCH = (req: NextRequest) => getHandler()(req);
