# Repository Guidelines

## Project Structure & Module Organization

This repository is a browser-only React 19 application built with Vite and TypeScript. Application code lives in `src/`: page-level views are in `src/pages/`, reusable UI belongs in `src/components/`, domain types are defined in `src/types.ts`, API probing logic is in `src/api.ts`, and Zustand state with `localStorage` persistence is in `src/store.ts`. Global styles are kept in `src/styles.css`. Root-level files such as `vite.config.ts`, `tsconfig.json`, `vercel.json`, and `index.html` configure building and deployment. Generated output goes to `dist/` and must not be committed.

## Build, Test, and Development Commands

- `npm install` installs dependencies from `package-lock.json`.
- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` runs strict TypeScript checks and creates the production bundle in `dist/`.
- `npm run preview` serves the built bundle locally for a production-like check.

There is currently no automated test or lint script. Always run `npm run build` before opening a pull request.

## Coding Style & Naming Conventions

Follow the existing TypeScript/React style: two-space indentation, single quotes, no semicolons, and trailing commas in multiline structures. Use PascalCase for React components and page files (`Dashboard.tsx`), camelCase for variables and functions, and descriptive domain names for types. Prefer function components and typed props. Keep shared state in the Zustand store instead of duplicating it across pages. TypeScript is configured with `strict`, unused-symbol checks, and fallthrough protection; do not weaken these settings to bypass errors.

## Testing Guidelines

No test framework is configured yet. For UI changes, manually verify provider and token editing, probing, import/export, persistence after refresh, and the production preview. If adding tests, use Vitest with React Testing Library, place files beside the implementation as `*.test.ts` or `*.test.tsx`, and test user-visible behavior rather than implementation details.

## Commit & Pull Request Guidelines

The repository has no existing commit history from which to infer conventions. Use concise Conventional Commit messages, for example `feat: add provider health summary` or `fix: preserve tokens after import`. Pull requests should explain the user-facing change, list verification performed, link relevant issues, and include screenshots for visual updates. Keep changes focused and avoid committing API keys, exported configurations, `node_modules/`, or `dist/`.

## Security & Configuration

API keys are sensitive even though they remain in browser `localStorage`. Never add real credentials to source, fixtures, screenshots, or issue reports. Preserve the browser-only architecture and account for provider CORS restrictions when changing probe behavior.
