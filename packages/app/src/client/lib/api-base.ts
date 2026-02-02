/**
 * Returns the base API endpoint URL with the correct basePath prefix.
 * Handles the case where basePath is '/' (should be empty) or a custom path like '/llmops'.
 */
export function getAPIBaseEndpoint(): string {
  const basePath =
    window.bootstrapData?.basePath === '/'
      ? ''
      : window.bootstrapData?.basePath;
  return `${basePath}/api`;
}

/**
 * Returns just the basePath prefix (empty string for '/', otherwise the path like '/llmops').
 */
export function getBasePath(): string {
  return window.bootstrapData?.basePath === '/'
    ? ''
    : (window.bootstrapData?.basePath ?? '');
}
