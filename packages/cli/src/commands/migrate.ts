/**
 * @fileoverview This file defines the 'migrate' command for the CLI application.
 * Steps:
 * 1. Look for package.json and @llmops/sdk in the current directory.
 * 2. Check if the @llmops/sdk version works with the current CLI version.
 * 3. If compatible, check for the config file passed as an argument.
 * 4. If the config file exists, read and parse it.
 * 5. If not passed, look for default config file locations.
 * 6. Use zod to validate the existing configuration schema.
 * 7. If valid, get the db adapter from the config.
 */
