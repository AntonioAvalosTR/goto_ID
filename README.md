# Go to ID

A tiny local Chrome extension that jumps you straight to an Azure DevOps work item. Paste (or type) the ID number, hit **Enter**, and the work item opens in a new tab.

---

## Why

Opening a work item by ID normally means loading the ADO site, finding the search box, pasting the number, and waiting for navigation — every single time. If you do that dozens of times a day, it adds up.

This extension collapses it into one action: click the toolbar button, paste the ID, press Enter. The org and project (`tr-design` / `Design Organization`) are already baked into the URL, so there's nothing to configure — it always points at our backlog.

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

1. Click the **Go to ID** button in the toolbar.
2. Paste or type the work item ID.
3. Press **Enter** (or click **Go to ID**).

The work item opens in a new tab and the popup closes. The input only accepts digits — anything else is stripped automatically, so a stray letter won't build a broken link.

Additionally, there is 2 buttons to the Current Sprint Backlog items and to the Sprint Progress represented by Graphs on a query pointing to current sprint. At the bottom you will see a Bookmarks dropdown to the most common places in our ADO project.



---

## What's in here

| File | What it does |
| --- | --- |
| `manifest.json` | Extension config — name, version, icons, and which popup to show. |
| `popup.html` | The little input box + button you see when you click the toolbar icon. |
| `popup.js` | Builds the ADO URL from the ID and opens it; also keeps the field digits-only. |
| `icon16 / 32 / 48 / 128 .png` | Toolbar and extensions-page icons at each size Chrome asks for. |
| `links.json` | List of labels and links, so they're cleaner to maintain. |
| `Browser-Extensions.md` | Short explanation about how Browser extensions work and their limitations. Read this for creating your own tools with the help of AI chats. |

---

## Notes & tweaks

- **Changing org/project:** the URL is hardcoded in `popup.js` to `tr-design` / `Design%20Organization`. If you ever need a different project, edit the `url` line in `popup.js` and reload the extension. (The `ORG` and `PROJECT` constants at the top are leftover and currently unused — safe to ignore or delete.)
- **Open in a window instead of a tab:** in `popup.js`, swap `chrome.tabs.create({ url })` for `chrome.windows.create({ url })`.
- **Developer-mode prompts:** because this is an unpacked extension, Chrome may occasionally ask you to re-enable it after a restart, or warn about developer-mode extensions. That's normal for a personal tool and nothing to worry about.

---

## Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, etc.).
- Access to `dev.azure.com/tr-design` — the extension just opens the URL; you still need to be signed in to ADO to see the item.