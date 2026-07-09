# Go to ID

A tiny local Chrome extension for Azure DevOps. Type a work item **ID** to jump straight to it, or type **any text** to run a scoped work-item **search** — plus one-click quick links and a bookmarks dropdown for the places you visit most.

**New in v3:** a **Settings page** lets you customize the org, project, area path, and bookmarks without touching any code.

---

## Why

Opening a work item by ID normally means loading the ADO site, finding the search box, pasting the number, and waiting for navigation — every single time. If you do that dozens of times a day, it adds up.

This extension collapses it into one action: click the toolbar button, type, press Enter. A number opens the work item directly; text runs a search already scoped to a chosen area path.

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
   - **Any text** (a word or phrase with letters) → opens a scoped ADO work-item search for those terms, limited to your configured area path. Spaces and special characters are encoded automatically, so searching `apply borderRadius` just works.
3. Press **Enter** (or click the button).

The result opens in a new tab and the popup closes.

Below the input are two quick buttons — **Current Sprint** (the current sprint backlog) and **Sprint Progress** (the progress-charts query) — plus any others defined in `links.json`. At the bottom, a **Bookmarks** dropdown links to your saved places.

---

## Customizing it (Settings)

Everything you'd previously edit in code now lives on a **Settings page**.

**To open it:** right-click the toolbar icon → **Options** (or go to `chrome://extensions`, open the extension's **Details**, and click **Extension options**). It opens in a full tab.

**Azure DevOps target** — set the three values that build every URL:
- **Organization** — e.g. `tr-design`.
- **Project** — plain text, e.g. `Design Organization`. Do **not** URL-encode it; the extension does that for you.
- **Area path** — the path *below* the project used to scope searches, e.g. `designOrg\Saffron Design System`. Don't include the project name, and **mind the casing** (lowercase `designOrg`).

Click **Save settings**. Reopen the popup to use the new target.

**Bookmarks** — add and remove the entries that appear in the popup's Bookmarks dropdown. Provide a label and an `http(s)` URL and click **Add**; the **newest one appears at the top**. Each has a **Remove** button. The list is seeded from `links.json` the first time you open Settings, so your existing bookmarks are already there.

Settings are stored in your browser (via Chrome's `storage`), so they follow you across your signed-in Chrome instances. Nothing is sent anywhere.

> **Not managed in Settings:** the two quick-link buttons (Current Sprint / Sprint Progress) still live in `links.json` — see below.

---

## What's in here

| File | What it does |
| --- | --- |
| `manifest.json` | Extension config — name, version, icons, the `storage` permission, and the Settings page registration. |
| `popup.html` | The popup UI: the input + button, the quick-link row, and the bookmarks dropdown. |
| `popup.js` | Builds the URL from the input (digits → work item, text → scoped search) and opens it; renders the quick-link buttons and bookmarks. Reads the target and bookmarks from Settings, with fallbacks. |
| `options.html` | The Settings page UI. |
| `options.js` | Loads/saves the org/project/area path and the bookmarks list. |
| `links.json` | The quick-link buttons (`links`) and the **default** bookmarks (`bookmarks`) used to seed Settings on first use. |
| `icon16 / 32 / 48 / 128 .png` | Toolbar and extensions-page icons at each size Chrome asks for. |
| `Browser-Extensions.md` | A short explainer on how browser extensions work and their limits. Read this for building your own tools with the help of AI chats. |

---

## Notes & tweaks

- **Changing org / project / area path — use the Settings page**, not the code. Plain text, no URL-encoding; casing matters for the area path.

- **The constants at the top of `popup.js` are now just fallback defaults.** They're only used if Settings has never been saved. Editing them changes the defaults, not the live behavior once you've saved settings — so day-to-day customization belongs in Settings.

- **Quick links vs. bookmarks — two different sources.**
  - The **quick-link row** (Current Sprint, Sprint Progress, …) is read from `links.json` (`links`). Edit that file to change those buttons.
  - **Bookmarks** are managed in **Settings** and stored in the browser. `links.json` (`bookmarks`) only provides the initial seed the first time Settings is opened; after that, the saved copy is the source of truth.

- **Resetting to defaults:** remove and re-add the extension (which clears its stored settings and bookmarks), then reopen Settings to re-seed from `links.json`. *(A "Restore defaults" button could be added to Settings if that becomes a common need.)*

- **Open in a window instead of a tab:** in `popup.js`, swap `chrome.tabs.create({ url })` for `chrome.windows.create({ url })` inside the `openUrl` helper.

- **The `storage` permission** (added in v3) is what lets the extension remember your Settings. It only stores your own configuration; it doesn't read pages, history, or anything else.

- **Developer-mode prompts:** because this is an unpacked extension, Chrome may occasionally ask you to re-enable it after a restart, or warn about developer-mode extensions. That's normal for a personal tool and nothing to worry about.

---

## Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, etc.).
- Access to `dev.azure.com/<your-org>` — the extension just opens the URL; you still need to be signed in to ADO to see the item or search results.
