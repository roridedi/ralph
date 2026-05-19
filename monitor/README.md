# Ralph Monitor

Ralph Monitor is a **local-only** web UI and daemon for watching and managing Ralph runs without leaving the browser.

## Security model

- The daemon binds to `127.0.0.1` by default.
- There is **no authentication** in this MVP, so do not expose it to untrusted networks.
- Override the bind host or port only if you understand the risk:
  - `MONITOR_HOST` (default `127.0.0.1`)
  - `MONITOR_PORT` (default `7777`)

## Install and run

```bash
cd monitor
npm install
npm run dev
```

Then open <http://localhost:7777>.

### Available scripts

- `npm run dev` — runs the Fastify daemon and Vite web build watcher together
- `npm run build` — typechecks/builds the server and web bundle
- `npm run start` — runs the built daemon, which serves the built web bundle

## What the UI does

- Dashboard for run status, active branch, next story, iteration timeline, and latest commit
- Stories board for editing `prd.json`, toggling `passes`, reordering priorities, and adding stories
- Console view for live Ralph logs, grouped by iteration, with start/stop controls
- History page for archived runs in `archive/`
- Settings page for runtime defaults, git behavior, path overrides, and optional quality checks

## Settings

The daemon reads and writes `monitor.config.json` in the repo root. The file is optional; sensible defaults are used when it does not exist.

### Tool

- `defaultTool` — default `amp` or `claude` selection for new runs
- `defaultMaxIterations` — default iteration cap

### Git

These actions are orchestrated by the daemon **after** Ralph emits `<promise>COMPLETE</promise>`.

- `autoMergeOnComplete`
- `targetBranch`
- `mergeStrategy` (`merge`, `squash`, `rebase`)
- `deleteBranchAfterMerge`
- `pushBeforeMerge`
- `createPullRequest`
- `pullRequestDraft`

The daemon never force-pushes and only deletes branches when git reports them as merged.

### Run

- `pauseOnFailure`
- `notifyOnComplete`
- `soundOnComplete`
- `autoRestartOnPrdChange`

### Paths

Advanced overrides for `repoRoot`, `ralphScript`, `prdFile`, and `progressFile`.

Path validation rejects traversal outside the configured repo root for Ralph-managed files.

### Quality checks

Optional shell commands run by the daemon after each iteration.

## Notes

- `prd.json`, `progress.txt`, `.last-branch`, and `archive/` remain the source of truth.
- `monitor.config.json` is gitignored by default.
- The browser reconnects automatically by refetching data and replaying the last 1000 in-memory log lines from the daemon.
