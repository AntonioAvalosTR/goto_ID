# Go to ID

A tiny local Chrome extension for Azure DevOps. Type a work item **ID** to jump straight to it, or type **any text** to run a scoped work-item **search** — plus one-click quick links and a bookmarks dropdown for the places you visit most.

**New in v3:** a **Settings page** lets you customize everything without touching code — the Azure DevOps target (org / project / area path), the quick-link buttons, and the bookmarks. Each section has a **Reset to default** button, a **cog icon** in the popup header opens Settings, and a keyboard shortcut (**Ctrl+Shift+G**) opens the popup from anywhere.

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

1. Open the popup — click the toolbar button or press **Ctrl+Shift+G** (**⌘+Shift+G** on Mac). The header shows the title and a **cog** that opens Settings.
2. Type or paste into the box:
   - **A work item ID** (all digits) → opens that work item directly.
   - **Any text** (a word or phrase with letters) → opens a scoped ADO work-item search for those terms, limited to your configured area path. Spaces and special characters are encoded automatically, so searching `apply borderRadius` just works.
3. Press **Enter**, or click the **magnifying-glass** button.

The result opens in a new tab and the popup closes.

Below the input is a row of **quick-link buttons**, and at the bottom a **Bookmarks** dropdown. Both are fully editable in Settings.

---

## Customizing it (Settings)

All customization lives on the **Settings page**.

**To open it:** click the **cog** in the popup header, or right-click the toolbar icon → **Options**, or open the extension's **Details** in `chrome://extensions` and click **Extension options**. It opens in a full tab.

The page has three sections, each with its own **Reset to default** button that restores that section's original setup:

- **Azure DevOps target** — the three values that build every URL:
  - **Organization** — e.g. `tr-design`.
  - **Project** — plain text, e.g. `Design Organization`. Do **not** URL-encode it; the extension does that for you.
  - **Area path** — the path *below* the project used to scope searches, e.g. `designOrg\Saffron Design System`. Don't include the project name, and **mind the casing** (lowercase `designOrg`). Click **Save settings** when done.
- **Quick links** — add and remove the buttons shown under the input in the popup. Provide a label and an `http(s)` URL and click **Add**; the **newest appears first**. Each has a **Remove** button.
- **Bookmarks** — same editing, for the entries in the popup's Bookmarks dropdown.

Both lists are seeded from `links.json` the first time you open Settings, so your existing links and bookmarks are already there. Settings are stored in your browser (via Chrome's `storage`), so they follow you across your signed-in Chrome instances. Nothing is sent anywhere.

---

## Accessibility

The popup and Settings page are built to work with the keyboard and with screen readers.

**Keyboard**
- Open the popup from any tab with **Ctrl+Shift+G** (**⌘+Shift+G** on Mac); the input is focused automatically.
- **Tab** / **Shift+Tab** move between controls; **Enter** runs the ID/search box and activates buttons and links.
- In the **Bookmarks** dropdown, opening it moves focus to the first item, **Tab** cycles through the rest, and **Esc** closes it and returns focus to the Bookmarks button. The focused item shows a clear outline.

**Screen readers**
- Every control has a name — the ID/search box, the Settings fields, and the icon-only buttons (search, cog) all announce their purpose, and each **Remove** button names the item it removes (e.g. "Remove Wiki").
- Saving, resetting, and validation errors are announced automatically (they're live regions), so you get spoken confirmation or an error without hunting for it.
- The popup title is a heading and the Quick links / Bookmarks are real lists, so you can navigate by heading and hear item counts.
- Each Settings field's helper text (e.g. "don't URL-encode", "mind the casing") is read out when the field is focused.

---

## What's in here

| File | What it does |
| --- | --- |
| `manifest.json` | Extension config — name, version, icons, the `storage` permission, and the Settings page registration. |
| `popup.html` | The popup UI: the header (title + cog), the input + search button, the quick-link row, and the bookmarks dropdown. |
| `popup.js` | Builds the URL from the input (digits → work item, text → scoped search) and opens it; renders the quick links and bookmarks. Reads the target, quick links, and bookmarks from Settings, with fallbacks. |
| `options.html` | The Settings page UI (target + the two editable lists, each with a reset button). |
| `options.js` | Loads/saves the target and both lists; one shared list manager powers Quick links and Bookmarks. |
| `styles.css` | Shared styling for both the popup and the Settings page. |
| `links.json` | The **default** quick links (`links`) and bookmarks (`bookmarks`) — used to seed Settings on first use and to restore on reset. |
| `img/` | The toolbar/extension icons (16/32/48/128). |
| `docs/Browser-Extensions.md` | A short explainer on how browser extensions work and their limits. Read this for building your own tools with the help of AI chats. |

---

## Notes & tweaks

- **Change anything via the Settings page**, not the code — the ADO target, the quick-link buttons, and the bookmarks are all editable there. Each section has a **Reset to default** to undo your changes and restore the original setup.

- **Quick links and bookmarks share one source of truth.** Both are managed in Settings and stored in the browser. `links.json` provides the initial seed the first time Settings is opened, and the defaults that **Reset to default** restores. Day-to-day, edit them in Settings; edit `links.json` only if you want to change the defaults themselves.

- **The constants at the top of `popup.js` (and `options.js`) are fallback defaults** for the ADO target — used only until you save settings. Editing them changes the defaults, not the live behavior once you've saved.

- **Open in a window instead of a tab:** in `popup.js`, swap `chrome.tabs.create({ url })` for `chrome.windows.create({ url })` inside the `openUrl` helper.

- **The `storage` permission** (added in v3) is what lets the extension remember your Settings. It only stores your own configuration; it doesn't read pages, history, or anything else.

- **Keyboard shortcut.** **Ctrl+Shift+G** (**⌘+Shift+G** on Mac) opens the popup from any tab. Change or clear it at `chrome://extensions/shortcuts`. If it doesn't fire right after loading, set it there once — Chrome applies suggested shortcuts at install time and won't always override an existing binding.

- **Developer-mode prompts:** because this is an unpacked extension, Chrome may occasionally ask you to re-enable it after a restart, or warn about developer-mode extensions. That's normal for a personal tool and nothing to worry about.

---

## Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, etc.).
- Access to `dev.azure.com/<your-org>` — the extension just opens the URL; you still need to be signed in to ADO to see the item or search results.
