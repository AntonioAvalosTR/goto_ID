// Fallback defaults (raw, NOT URL-encoded) — used if the options page was never opened.
// These mirror the DEFAULTS in options.js.
const DEFAULTS = {
  org: "tr-design",
  project: "Design Organization",
  area: "designOrg\\Saffron Design System",
};

// Live config, overridden from chrome.storage on load.
let config = { ...DEFAULTS };

const input = document.getElementById("wid");
const button = document.getElementById("go");
const linksContainer = document.getElementById("links");
const bookmarksToggle = document.getElementById("bookmarksToggle");
const bookmarksMenu = document.getElementById("bookmarksMenu");
const openOptionsButton = document.getElementById("openOptions");
const bookmarksSection = document.querySelector(".bookmarks");

// --- Open a URL in a new tab and close the popup ---
function openUrl(url) {
  chrome.tabs.create({ url });
  window.close();
}

// --- Submit: all digits => open that work item; any text => ADO search ---
function go() {
  const query = input.value.trim();
  if (!query) return;                       // nothing entered, do nothing

  // Encode the configured values at the point of use (they're stored raw).
  const org = config.org;                   // org slugs have no spaces; used as-is
  const project = encodeURIComponent(config.project);
  const area = encodeURIComponent(config.area);

  let url;
  if (/^\d+$/.test(query)) {
    // Pure number: treat as a work item ID and open it directly
    url = `https://dev.azure.com/${org}/${project}/_workitems/edit/${query}`;
  } else {
    // Contains non-digits: run a work-item search scoped to the configured area path.
    // encodeURIComponent makes spaces and special characters URL-safe (space => %20).
    const keywords = encodeURIComponent(query);
    url = `https://dev.azure.com/${org}/${project}/_search?text=${keywords}&type=workitem&lp=workitems-Team&filters=Projects%7B${project}%7DArea%20Paths%7B${project}%5C${area}%7D&pageSize=25`;
  }
  openUrl(url);
}

button.addEventListener("click", go);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") go();              // type/paste + Enter, no mouse
});

// --- Header cog: open the extension's Settings (options) page ---
openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

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
// Settings, quick links, and bookmarks all come from chrome.storage (options page).
// Each falls back to the bundled defaults (DEFAULTS / links.json) if never customized.
async function init() {
  const stored = await chrome.storage.sync.get(["settings", "links", "bookmarks"]);

  if (stored.settings) {
    config = {
      org: stored.settings.org || DEFAULTS.org,
      project: stored.settings.project || DEFAULTS.project,
      area: stored.settings.area || DEFAULTS.area,
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
  if (bookmarks.length > 0) {
    buildMenuItems(bookmarks, bookmarksMenu);
  } else {
    bookmarksSection.hidden = true;               // no bookmarks => hide the dropdown entirely
  }
}

init();

// --- Bookmarks dropdown open/close ---
bookmarksToggle.addEventListener("click", () => {
  const opening = bookmarksMenu.hidden;              // hidden now => we're opening it
  bookmarksMenu.hidden = !opening;
  bookmarksToggle.setAttribute("aria-expanded", String(opening));
});
