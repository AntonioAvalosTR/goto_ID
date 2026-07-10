// Fallback defaults (raw, NOT URL-encoded) — used if the options page was never opened.
// These mirror the DEFAULTS in options.js.
const DEFAULTS = {
  org: "tr-design",
  project: "Design Organization",
  area: "designOrg\\Saffron Design System",
};

// Popup preferences (History on/off + item count, and which sections show).
// Defaults mirror PREF_DEFAULTS in options.js; overridden from chrome.storage on load.
const PREF_DEFAULTS = { historyEnabled: true, historyMax: 6, showLinks: true, showBookmarks: true };
let prefs = { ...PREF_DEFAULTS };

// Keep a stored item count within sane bounds (1–20), else fall back to the default.
function clampMax(n) {
  const v = parseInt(n, 10);
  if (Number.isNaN(v)) return PREF_DEFAULTS.historyMax;
  return Math.min(20, Math.max(1, v));
}

// Live config, overridden from chrome.storage on load.
let config = { ...DEFAULTS };

const input = document.getElementById("wid");
const button = document.getElementById("go");
const linksContainer = document.getElementById("links");
const bookmarksToggle = document.getElementById("bookmarksToggle");
const bookmarksMenu = document.getElementById("bookmarksMenu");
const bookmarksSection = document.querySelector(".bookmarks");
const openOptionsButton = document.getElementById("openOptions");
const copyLinkButton = document.getElementById("copyLink");
const copyStatus = document.getElementById("copyStatus");
const historySection = document.querySelector(".history");
const historyToggle = document.getElementById("historyToggle");
const historyMenu = document.getElementById("historyMenu");
const clearHistoryButton = document.getElementById("clearHistory");
const mainDivider = document.getElementById("mainDivider");

// --- Open a URL in a new tab and close the popup ---
function openUrl(url) {
  chrome.tabs.create({ url });
  window.close();
}

// --- Build the clean, shareable work-item URL from an ID + the configured target ---
function workItemUrl(id) {
  const project = encodeURIComponent(config.project);
  return `https://dev.azure.com/${config.org}/${project}/_workitems/edit/${id}`;
}

// --- Build the scoped ADO work-item search URL for some keywords ---
function searchUrl(query) {
  const project = encodeURIComponent(config.project);
  const area = encodeURIComponent(config.area);
  const keywords = encodeURIComponent(query);
  return `https://dev.azure.com/${config.org}/${project}/_search?text=${keywords}&type=workitem&lp=workitems-Team&filters=Projects%7B${project}%7DArea%20Paths%7B${project}%5C${area}%7D&pageSize=25`;
}

// --- History ------------------------------------------------------------
// Persisted in chrome.storage.sync, de-duped by URL, newest first, capped at the
// configured count. Each entry: { type: "id" | "search" | "copy", label, url }.
// The full URL is stored at creation time (see the disclaimer on the options page).
// No-op when History is turned off in Settings.
async function recordHistory(entry) {
  if (prefs.historyEnabled === false) return null;
  try {
    const { history = [] } = await chrome.storage.sync.get(["history"]);
    const deduped = history.filter((h) => h.url !== entry.url);   // no duplicates
    deduped.unshift(entry);                                        // newest on top
    const trimmed = deduped.slice(0, prefs.historyMax);
    await chrome.storage.sync.set({ history: trimmed });
    return trimmed;
  } catch (e) {
    console.error("Could not record history:", e);
    return null;
  }
}

// Short text tag shown (and read by screen readers) before each history label.
function tagText(type) {
  if (type === "id") return "ID";
  if (type === "search") return "Search";
  return "Copied";
}

function renderHistory(items) {
  historyMenu.innerHTML = "";
  // Off in Settings => never show; otherwise show the newest up to the configured count.
  const list = prefs.historyEnabled === false ? [] : (items || []).slice(0, prefs.historyMax);
  if (list.length === 0) {
    historySection.hidden = true;             // nothing to show => hide the section
    return;
  }
  historySection.hidden = false;
  for (const item of list) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "dropdown-item history-item";
    link.href = item.url;                     // real href: right-click / copy works
    link.title = item.label;                  // full label on hover if truncated
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openUrl(item.url);
    });

    const tag = document.createElement("span");
    tag.className = "history-tag";
    tag.textContent = tagText(item.type);     // "ID" / "Search" / "Copied"

    const label = document.createElement("span");
    label.className = "history-label";
    label.textContent = item.label;

    link.append(tag, label);                  // name reads e.g. "Search apply borderRadius"
    li.appendChild(link);
    historyMenu.appendChild(li);
  }
}

// --- Submit: all digits => open that work item; any text => ADO search ---
// async so we can await the history write before the popup closes.
async function go() {
  const query = input.value.trim();
  if (!query) return;                         // nothing entered, do nothing

  if (/^\d+$/.test(query)) {
    const url = workItemUrl(query);           // pure number => open that work item
    await recordHistory({ type: "id", label: `#${query}`, url });
    openUrl(url);
    return;
  }
  const url = searchUrl(query);               // contains non-digits => scoped search
  await recordHistory({ type: "search", label: query, url });
  openUrl(url);
}

button.addEventListener("click", go);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") go();                // type/paste + Enter, no mouse
});

// --- Header cog: open the extension's Settings (options) page ---
openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// --- Header clipboard: copy a clean link to the current page's work item ---
// Pull the ID out of whatever URL shape ADO is using.
function extractWorkItemId(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (e) {
    return null;
  }
  // 1. ?workitem=<id> or &workitem=<id> (searchParams handles either)
  const param = url.searchParams.get("workitem");
  if (param && /^\d+$/.test(param)) return param;
  // 2. .../_workitems/edit/<id>
  const wi = url.pathname.match(/_workitems\/edit\/(\d+)/);
  if (wi) return wi[1];
  // 3. .../_queries/edit/<id>/  (numeric segment = the open work item within a query)
  const q = url.pathname.match(/_queries\/edit\/(\d+)/);
  if (q) return q[1];
  return null;
}

// Copy text to the clipboard, with a fallback for when the async API is blocked.
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e2) {
      return false;
    }
  }
}

// Escape text for safe insertion into an HTML anchor.
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Turn the browser tab title into a human-readable work-item label.
// ADO tab titles look like "<title> - Boards - <project>"; trim the trailing
// breadcrumb sections and any leading "<id>:" prefix. Fall back to "Work item <id>".
const TITLE_NOISE = new Set([
  "Boards", "Repos", "Pipelines", "Test Plans", "Artifacts", "Queries",
  "Dashboards", "Overview", "Wiki", "Azure DevOps", "Azure DevOps Services",
]);
function labelFromTitle(rawTitle, id) {
  let parts = String(rawTitle || "").split(" - ").map((s) => s.trim()).filter(Boolean);
  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (TITLE_NOISE.has(last) || last === config.project || last === config.org) {
      parts.pop();
    } else {
      break;
    }
  }
  let label = parts.join(" - ").replace(new RegExp("^" + id + "\\s*[:\\-]?\\s*"), "").trim();
  if (!label || TITLE_NOISE.has(label) || label === config.project) return `Work item ${id}`;
  return label;
}

// Write a rich link (text/html + text/plain) so it pastes as a titled link in
// rich-text apps and as the clean URL in plain-text targets. Falls back to plain.
async function copyRichLink(url, label) {
  const html = `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
  try {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([url], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return true;
  } catch (e) {
    return copyToClipboard(url);   // fallback: plain URL only
  }
}

async function copyWorkItemLink() {
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) {
    copyStatus.textContent = "Couldn't read the current tab.";
    return;
  }
  const id = tab && tab.url ? extractWorkItemId(tab.url) : null;
  if (!id) {
    copyStatus.textContent = "No work item ID on this page. Click on the top-left ID link first.";
    return;
  }
  const url = workItemUrl(id);
  const label = labelFromTitle(tab.title, id);
  const ok = await copyRichLink(url, label);
  if (ok) {
    copyStatus.textContent = `Copied link to #${id}.`;
    const updated = await recordHistory({ type: "copy", label, url });  // only on success
    if (updated) renderHistory(updated);      // show it without reopening the popup
  } else {
    copyStatus.textContent = "Couldn't copy to the clipboard.";
  }
}

copyLinkButton.addEventListener("click", copyWorkItemLink);

// --- Quick-link ROW: render each entry as a button ---
function buildButtons(items, container) {
  if (!items) return;
  for (const item of items) {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.addEventListener("click", () => openUrl(item.url));
    container.appendChild(btn);
  }
}

// --- Bookmarks MENU: render each entry as a dropdown-item link ---
function buildMenuItems(items, container) {
  if (!items) return;
  for (const item of items) {
    const link = document.createElement("a");
    link.className = "dropdown-item";
    link.href = item.url;                   // real href: right-click / copy works
    link.textContent = item.label;
    link.addEventListener("click", (e) => {
      e.preventDefault();                   // handle it ourselves in a new tab
      openUrl(item.url);
    });
    container.appendChild(link);
  }
}

// --- Load config + content ---
// Settings, quick links, bookmarks, and history all come from chrome.storage.
// Each falls back to the bundled defaults (DEFAULTS / links.json) if never customized.
async function init() {
  const stored = await chrome.storage.sync.get(["settings", "links", "bookmarks", "history", "prefs"]);

  if (stored.settings) {
    config = {
      org: stored.settings.org || DEFAULTS.org,
      project: stored.settings.project || DEFAULTS.project,
      area: stored.settings.area || DEFAULTS.area,
    };
  }

  if (stored.prefs) {
    prefs = {
      historyEnabled: stored.prefs.historyEnabled !== false,   // default on
      historyMax: clampMax(stored.prefs.historyMax),
      showLinks: stored.prefs.showLinks !== false,             // default on
      showBookmarks: stored.prefs.showBookmarks !== false,     // default on
    };
  }

  let fileData = { links: [], bookmarks: [] };
  try {
    const response = await fetch("links.json");
    fileData = await response.json();
  } catch (error) {
    console.error("Could not load links.json:", error);
  }

  const links = Array.isArray(stored.links)
    ? stored.links                                // managed via the options page
    : (fileData.links || []);                     // fallback: bundled defaults
  buildButtons(links, linksContainer);

  const bookmarks = Array.isArray(stored.bookmarks)
    ? stored.bookmarks                            // managed via the options page
    : (fileData.bookmarks || []);                 // fallback: bundled defaults
  buildMenuItems(bookmarks, bookmarksMenu);

  // Section visibility from Settings. Bookmarks also hides when there's nothing in it.
  // When both the quick-link row and Bookmarks are hidden, hide the divider too.
  const linksVisible = prefs.showLinks !== false;
  const bookmarksVisible = prefs.showBookmarks !== false && bookmarks.length > 0;
  linksContainer.hidden = !linksVisible;
  bookmarksSection.hidden = !bookmarksVisible;
  mainDivider.hidden = !(linksVisible || bookmarksVisible);

  renderHistory(Array.isArray(stored.history) ? stored.history : []);
}

init();

// --- Bookmarks dropdown open/close ---
bookmarksToggle.addEventListener("click", () => {
  const opening = bookmarksMenu.hidden;              // hidden now => we're opening it
  bookmarksMenu.hidden = !opening;
  bookmarksToggle.setAttribute("aria-expanded", String(opening));
  if (opening) {
    const firstItem = bookmarksMenu.querySelector(".dropdown-item");
    if (firstItem) firstItem.focus();                // move focus into the menu
  }
});

// Escape closes the dropdown and returns focus to the toggle
bookmarksSection.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !bookmarksMenu.hidden) {
    bookmarksMenu.hidden = true;
    bookmarksToggle.setAttribute("aria-expanded", "false");
    bookmarksToggle.focus();
  }
});

// --- History dropdown open/close, Escape, and Clear ---
historyToggle.addEventListener("click", () => {
  const opening = historyMenu.hidden;
  historyMenu.hidden = !opening;
  historyToggle.setAttribute("aria-expanded", String(opening));
  if (opening) {
    const firstItem = historyMenu.querySelector(".dropdown-item");
    if (firstItem) firstItem.focus();                // move focus into the menu
  }
});

historySection.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !historyMenu.hidden) {
    historyMenu.hidden = true;
    historyToggle.setAttribute("aria-expanded", "false");
    historyToggle.focus();
  }
});

clearHistoryButton.addEventListener("click", async () => {
  await chrome.storage.sync.set({ history: [] });
  renderHistory([]);                                 // empties the list and hides the section
  copyStatus.textContent = "History cleared.";       // announced via the status line
  input.focus();                                     // move focus somewhere sensible
});
