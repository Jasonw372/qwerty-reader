<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

## Supabase Integration

This project supports optional Supabase integration for cloud sync.

### Setup Steps

1. Create a Supabase project at https://supabase.com
2. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. Run `docs/supabase-setup.sql` in Supabase SQL Editor
4. Install the dependency: `vp add @supabase/supabase-js`

### Key Files

- `src/lib/supabase.ts` — Client initialization
- `src/store/authStore.ts` — Auth state management
- `src/hooks/useSync.ts` — Data sync (articles + sessions)
- `src/types/supabase.ts` — Database type definitions
- `docs/supabase-setup.sql` — SQL schema + RLS policies

### Architecture

- Auth: Supabase Auth (email/password) via `authStore`
- Sync: `useSyncArticles` hook for CRUD on articles
- Tracking: `uploadSession` saves each practice session to `typing_sessions`
- Security: Row Level Security (RLS) on all tables

<!--VITE PLUS END-->
