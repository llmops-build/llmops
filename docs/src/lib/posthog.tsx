'use client';

import posthog from 'posthog-js';
import { useEffect, useRef } from 'react';
import { useLocation } from '@tanstack/react-router';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

function initPostHog() {
  if (initialized || typeof window === 'undefined' || !POSTHOG_KEY) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll capture manually for SPA navigation
    capture_pageleave: true,
  });

  initialized = true;
}

export function PostHogPageView() {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    // Only capture if path actually changed
    if (
      initialized &&
      POSTHOG_KEY &&
      lastPathRef.current !== location.pathname
    ) {
      lastPathRef.current = location.pathname;
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
  });

  return null;
}

export { posthog };
