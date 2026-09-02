# AGENTS.md

This is the sticky tech-demos monorepo. Future cloud agents add one demo at a time.

## Hard rules

- Only add or update `apps/<kebab-slug>/`. Never rewrite sibling apps. Never create a new repository.
- Each app is self-contained: `bun install && bun run dev` from that folder.
- Bun is the runtime, package manager, and script runner.
- Every Bun project (including each new app) must have `bunfig.toml` with `[install] minimumReleaseAge = 259200` **before** `bun install` or `bun add`.
- Plan with `skills/project-planning/` and write `apps/<kebab-slug>/PLAN.md` before coding.
- Every PR MUST attach at least one screenshot AND at least one video of the running app. Not optional.
- Cloudflare previews: one Pages project for the whole repo, path per `apps/<slug>/`. Do not create one Pages project per app.
- GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` live on this repo when previews are enabled.
