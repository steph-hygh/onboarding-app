/**
 * GraphQL config, read by two tools:
 *   - `npm run graphql-codegen`: generates TypeScript types into ./shared/types
 *   - the VS Code GraphQL extension: autocomplete and validation inside `#graphql` strings
 *
 * Each project below has its own schema. Both tools choose the project for a
 * file by checking which project's `documents` globs match that file. The globs
 * MUST NOT overlap: a file that matches both projects is checked against the
 * wrong schema.
 *
 * Convention:
 *   - extensions/app-*      → Admin API       (admin UI extensions, they call `fetch('shopify:admin/...')`)
 *   - extensions/customer-account-* → Customer Account API (they call `fetch('shopify://customer-account/...')`)
 *   - every other extension → Storefront API  (checkout UI extensions, they call `shopify.query()`)
 *   - shared/models         → Admin API       (data helpers used by the app-* extensions)
 *
 * When you add a new extension, the handle (folder name) decides its API.
 * Name admin extensions `app-...`.
 *
 * After changing this file, run `npm run graphql-codegen` and then run
 * "Developer: Reload Window" so the VS Code extension picks up the change.
 */
const { ApiType, shopifyApiProject } = require('@shopify/api-codegen-preset');

// Keep in sync with `api_version` in the extensions' shopify.extension.toml files.
const apiVersion = '2026-10';

// The Customer Account API schema is downloaded per app, so it needs the app's
// API key (the public `client_id` in shopify.app.toml).
const appApiKey = require('fs')
  .readFileSync(require('path').join(__dirname, 'shopify.app.toml'), 'utf8')
  .match(/^client_id\s*=\s*"([^"]+)"/m)?.[1];

// Source files we scan for `#graphql` template strings.
const SOURCE_FILES = 'src/**/*.{ts,tsx,js,jsx}';

module.exports = {
  projects: {
    // Storefront API: every extension whose folder does NOT start with "app-".
    // `!(app-*)` is a glob pattern that matches one path segment, excluding names that start with "app-".
    // Output: shared/types/storefront.{types,generated}.d.ts
    default: shopifyApiProject({
      apiType: ApiType.Storefront,
      apiVersion,
      documents: [`./extensions/!(app-*|customer-account-*)/${SOURCE_FILES}`],
      outputDir: './shared/types',
    }),

    // Admin API: extensions whose folder starts with "app-", plus shared/models.
    // Output: shared/types/admin.{types,generated}.d.ts
    admin: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion,
      documents: [
        `./extensions/app-*/${SOURCE_FILES}`,
        './shared/models/**/*.ts',
      ],
      outputDir: './shared/types',
    }),

    // Customer Account API: extensions whose folder starts with "customer-account-".
    // They call `fetch('shopify://customer-account/api/<version>/graphql.json', ...)`.
    // Output: shared/types/customer.{types,generated}.d.ts
    customer: shopifyApiProject({
      apiType: ApiType.Customer,
      apiVersion,
      apiKey: appApiKey,
      documents: [`./extensions/customer-account-*/${SOURCE_FILES}`],
      outputDir: './shared/types',
    }),
  },
};
