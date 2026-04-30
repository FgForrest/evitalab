---
name: generate-evitadb-client
description: Regenerate gRPC TypeScript types from the evitaDB repository. Use when the user wants to refresh, regenerate, or update gRPC/proto-generated TS client code in evitaLab.
user_invocable: true
---

# generate-evitadb-client

Regenerate gRPC TypeScript types in evitaLab from the evitaDB repository's proto definitions.

## Strict rules

- **Do NOT edit any source code**, even if compilation, lint, or test errors appear after regeneration.
- **Do NOT commit anything** to git.
- Only run the steps below and report results.

## Workflow

### Step 1 — Activate the Node version from `.nvmrc`

Run:

```bash
nvm use
```

This switches Node to the version pinned in `.nvmrc`.

**If the command fails with a "not yet installed" error** (or similar — e.g. `N/A: version "vX.Y.Z" is not yet installed`), install that version and retry, all in one shell invocation:

```bash
nvm install && nvm use
```

If activation still fails after that (network errors, version not found on remote, etc.), **stop immediately** and report the error to the user.

### Step 2 — Ensure yarn is installed

Run:

```bash
npm install -g yarn
```

This installs (or refreshes) the `yarn` binary globally for the active Node version. If install fails, **stop immediately** and report the error.

### Step 3 — Install project dependencies

Run:

```bash
yarn install
```

This ensures `@bufbuild/buf` and other tooling have their platform binaries downloaded. If install fails, **stop immediately** and report the error.

### Step 4 — Ask for evitaDB repo path

Ask the user for the absolute path to their local evitaDB repository checkout. Wait for their answer before proceeding. Do not guess or assume the path.

### Step 5 — Run the generator script

Run the project's generator script with the user-provided path as the first argument:

```bash
./generate-evitadb-client.sh <evitadb-repo-path>
```

If this script exits with a non-zero status, **stop immediately** and report the error to the user. Do not proceed to later steps.

### Step 6 — Run tests

Run:

```bash
yarn test
```

Capture the output. **Do not stop** if tests fail — continue to the next step. Note which tests failed and why (especially type errors caused by the regeneration).

### Step 7 — Run lint

Run:

```bash
yarn lint
```

Capture the output. Note any linting errors.

### Step 8 — Summarize compilation errors

Give the user a concise summary covering:
- Whether generation succeeded
- Test failures (counts + likely cause: type mismatches, missing exports, renamed symbols, etc.)
- Lint errors (counts + categories)
- A short list of the most likely **compilation errors** the user will need to fix manually (e.g. removed fields, renamed messages, changed enum values)

Remind the user that per the skill rules, no code was edited and nothing was committed — fixes are up to them.
