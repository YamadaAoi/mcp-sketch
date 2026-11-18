## Invocation

Every command below has two equivalent spellings — pick by installation:

```bash
playwright-cli <command>          # global install: npm install -g @playwright/cli@latest
npx -y @playwright/cli <command>  # no install needed (npx)
```

Plain CLI driving the browser: no MCP configuration, no session restart.

This page covers only the commands this project commonly uses; for anything more, append `--help` to any command for its full options, or run bare `playwright-cli --help` to list every command.

## Open the browser and visit the local dev server

```bash
playwright-cli open "{url}"
```

- Default is the bundled chromium (run `playwright-cli install` once first to fetch the browser binary)
- A system browser channel skips that download: `playwright-cli open "{url}" --browser=msedge` (or `chrome`)

## Set the viewport to the design size

```bash
playwright-cli resize 1920 1080
```

## Locate the drawn content

- Navigate routes directly: `playwright-cli goto "{url}"`
- Find elements by visible text: `playwright-cli find "Sign in"` (regex supported: `find --regex "/login|signin/i"`)
- Take `playwright-cli snapshot` for element refs, then interact: `playwright-cli click "e15"`; css selectors and role locators also work: `playwright-cli click ".submit-btn"`
- Run in-page JS when needed: `playwright-cli eval "document.title"`

## Screenshots

```bash
# full page (covers below-the-fold content; scroll through once first if content lazy-loads)
playwright-cli screenshot --full-page --filename=".sketch-cache/{design}/{page}/{artboard}/screenshot/{timestamp}.png"

# element screenshot (for component-level compare; the selector must be unique in the page)
playwright-cli screenshot ".user-table" --filename=".sketch-cache/{design}/{page}/{artboard}/screenshot/{timestamp}.png"
```

## Reusing login state

- Attach to the user's own browser with the Playwright extension installed (login state and cookies carry over): `playwright-cli attach --extension=chrome`
- Persistent profile (log in once, it stays): `playwright-cli open "{url}" --persistent`
- Storage-state file: `playwright-cli state-save "auth.json"` to save, later `playwright-cli state-load "auth.json"` to restore

## Session notes

- Commands share one long-lived browser session; no need to reopen between commands
- A headless session closes itself after an hour idle — just `open` again; headed and attached browsers stay open
- Cleanup or recovery: `playwright-cli close` (stop), `playwright-cli list` (list sessions), `playwright-cli kill-all` (force)

## Windows note

In cmd / PowerShell, `&` inside a URL is treated as a command separator: escape with `^&` in cmd, or prefix the command with `--%` in PowerShell; local dev URLs usually carry no query string, so this rarely applies
