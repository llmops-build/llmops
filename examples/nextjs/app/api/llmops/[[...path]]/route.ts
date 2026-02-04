import type { NextRequest } from 'next/server';
import { toNextJsHandler } from '@llmops/sdk/nextjs';
import { getLLMOpsClient } from '@/llmops';

// Use lazy initialization to avoid build-time execution
export async function GET(request: NextRequest) {
  const handlers = toNextJsHandler(getLLMOpsClient());
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const handlers = toNextJsHandler(getLLMOpsClient());
  return handlers.POST(request);
}

export async function PUT(request: NextRequest) {
  const handlers = toNextJsHandler(getLLMOpsClient());
  return handlers.PUT(request);
}

export async function DELETE(request: NextRequest) {
  const handlers = toNextJsHandler(getLLMOpsClient());
  return handlers.DELETE(request);
}

export async function PATCH(request: NextRequest) {
  const handlers = toNextJsHandler(getLLMOpsClient());
  return handlers.PATCH(request);
}
