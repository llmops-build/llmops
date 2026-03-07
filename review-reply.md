# Review Reply for PR #64

## Comment ID: 2899585497

**File:** `packages/core/src/db/migrations.ts`

**Reviewer question:** Do we need to handle the error for this? Just in case we are not able to get the function.

**Reply:**

Good catch — yes, error handling is needed here. The dynamic `import('better-auth/db')` can fail if the module is unavailable (e.g. in an environment where the package isn't resolvable), and without a try/catch that would result in an unhandled rejection that bubbles up to the caller with no useful context.

The fix wraps the import in a `try/catch`:

- On **success**: behaviour is identical to before — `getAuthMigrations` is called and auth migration changes are merged with the core ones.
- On **failure**: a warning is logged via the existing `logger` (consistent with how other failures in this function are handled, e.g. the `SET search_path` block above), and the function returns early with only the core migrations. `needsMigration` reflects only the core changes in that case, and `runMigrations` still executes all core migrations. This ensures the app degrades gracefully rather than crashing.
