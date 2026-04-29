# Cursor Cookbook Setup (Submodule + Local Example)

This project now includes the Cursor cookbook in two ways:

- Git submodule: `external/cursor-cookbook`
- Copied runnable SDK quickstart: `tools/cursor-sdk-quickstart`

## What Was Added

- `external/cursor-cookbook` tracks upstream examples from `https://github.com/cursor/cookbook`
- `tools/cursor-sdk-quickstart` is a local copy you can modify safely

## Run The Local SDK Quickstart

From repo root:

```bash
cd "tools/cursor-sdk-quickstart"
corepack enable
corepack pnpm install
```

Set a valid Cursor API key:

```bash
export CURSOR_API_KEY="crsr_..."
```

Optional model override:

```bash
export CURSOR_MODEL="composer-2"
```

Run:

```bash
corepack pnpm dev
```

## Required Dependency: ripgrep (`rg`)

The local Cursor SDK runtime uses `rg` for ignore-file mapping. If `rg` is missing, runs fail before prompt execution.

Check:

```bash
rg --version
```

If missing, install `ripgrep` for your OS, then rerun the quickstart.

## Keep Cookbook Updated

To update the submodule to latest upstream:

```bash
git submodule update --remote --init external/cursor-cookbook
```

