# Lucy — Claude Code Instructions

## How this repo works

Lucy uses a "prompts as source of truth" methodology. The `learn/` directory contains
`.joy.ts` files that are the canonical specification. The `lucy/` directory contains
generated code derived from those specs. When code needs to change, update the prompt
first, then regenerate.

`index.joy.ts` at the repo root is the master prompt file. Running it instructs Claude
to read all `learn/` specs and build the four sub-packages in order.

## Mono-repo structure

```
lucy/
  common/      — shared TypeScript types (@billdestein/joy-common)
  applets/     — windowing system (@billdestein/joy-applets)
  backend/     — Express API server
  frontend/    — React/Vite app
```

Build and dependency order: **common → applets → backend / frontend**

`backend/start.sh` is the production entry point. It builds common, applets, and
frontend, then starts the backend with `ts-node`.

## Code generation rules

1. **Type-check every package after generating code.** Run `tsc --noEmit` (or
   `node_modules/.bin/tsc --noEmit`) on each affected package before reporting done.
   Build in dependency order.

2. **Simulate production install before type-checking applets or common.** Those
   packages are built by `start.sh` in production where devDependencies are absent.
   Run `npm install --omit=dev` first, then type-check. A local `node_modules` already
   populated with devDependencies will give a false green.

3. **Backport fixes to the prompts.** If a bug is found and fixed in generated code,
   update the corresponding `learn/*.joy.ts` file so the fix survives the next
   regeneration.

## File access

Only read, write, or edit files within this repository. Do not access files outside it.
