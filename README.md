# Go to ID

A tiny local Chrome extension for Azure DevOps. Type a work item **ID** to jump straight to it, or type **any text** to run a scoped work-item **search** — plus one-click quick links and a bookmarks dropdown for the places you visit most.

---

## Why

Opening a work item by ID normally means loading the ADO site, finding the search box, pasting the number, and waiting for navigation — every single time. If you do that dozens of times a day, it adds up.

This extension collapses it into one action: click the toolbar button, type, press Enter. A number opens the work item directly; text runs a search already scoped to our Saffron area path. The org, project, and area path are baked in, so there's nothing to configure — it always points at our backlog.

It's a **personal, local tool**. It's not published to the Chrome Web Store; everyone loads it themselves from this repo. That keeps it free, private, and easy to tweak.

---

## Setup

1. **Get the files** — clone this repo (or download it as a ZIP and unzip it) somewhere you won't accidentally delete.
   ```
   git clone <repo-url>
   ```
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (toggle, top-right).
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. *(Optional but recommended)* Pin it: click the puzzle-piece icon in the toolbar, then the pin next to **Go to ID**, so the button is always visible.

That's it. To get updates later, `git pull` and then click the **reload** icon (circular arrow) on the extension's card in `chrome://extensions`.

---

## Use

1. Click the toolbar button.
2. Type or paste into the box:
   - **A work item ID** (all digits) → opens that work item directly.
   - **Any text** (a word or phrase with letters) → opens a scoped ADO work-item search for those terms, limited to the Saffron area path. Spaces and special characters are encoded automatically, so searching `apply borderRadius` just works.
3. Press **Enter** (or click the button).

The result opens in a new tab and the popup closes.

Below the input are two quick buttons — **Current Sprint** (the current sprint backlog) and **Sprint Progress** (the progress-charts query) — plus any others defined in `links.json`. At the bottom, a **Bookmarks** dropdown links to the most common places in our ADO project.

---

## What's in here

| File | What it does |
| --- | --- |
| `manifest.json` | Extension config — name, version, icons, and which popup to show. |
| `popup.html` | The popup UI: the input + button, the quick-link row, and the bookmarks dropdown. |
| `popup.js` | Builds the URL from the input (digits → work item, text → scoped search) and opens it; also renders the quick-link buttons and bookmarks from `links.json`. |
| `links.json` | The labels and URLs for the quick-link buttons and bookmarks, kept as data so they're easy to maintain. |
| `icon16 / 32 / 48 / 128 .png` | Toolbar and extensions-page icons at each size Chrome asks for. |
| `Browser-Extensions.md` | A short explainer on how browser extensions work and their limits. Read this for building your own tools with the help of AI chats. |

---

## Notes & tweaks

- **Changing org / project / area path.** These live as constants at the top of `popup.js`, and editing them updates *both* the open-by-ID URL and the search URL:
  - `ORG` — the organization (`tr-design`).
  - `PROJECT` — the project, **already URL-encoded** (`Design%20Organization`; the `%20` is the space).
  - `AREA_PATH` — the backlog's area path *below* the project, written **raw** (it gets URL-encoded for you when the search URL is built). **Mind the exact casing** — it's `designOrg` with a lowercase *d* to match the real ADO node. A capitalized `DesignOrg` can make the search filter miss.

  (Reminder: the leading `\` between the project and the area path is a literal `%5C` separator in the URL template; the backslash *inside* `AREA_PATH` becomes the second separator when encoded. Keep that in mind if you re-point the area path.)

- **Adding or editing quick links / bookmarks.** Edit `links.json` — no code changes needed. `links` = the button row; `bookmarks` = the dropdown. Each entry is `{ "label": "...", "url": "..." }`; add, remove, or rename freely and reload.

- **Open in a window instead of a tab:** in `popup.js`, swap `chrome.tabs.create({ url })` for `chrome.windows.create({ url })` inside the `openUrl` helper.

- **Developer-mode prompts:** because this is an unpacked extension, Chrome may occasionally ask you to re-enable it after a restart, or warn about developer-mode extensions. That's normal for a personal tool and nothing to worry about.

---

## Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, etc.).
- Access to `dev.azure.com/tr-design` — the extension just opens the URL; you still need to be signed in to ADO to see the item or search results.
