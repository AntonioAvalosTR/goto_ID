// Human-readable defaults (raw, NOT URL-encoded — encoding happens where used).
const DEFAULTS = {
  org: "tr-design",
  project: "Design Organization",
  area: "designOrg\\Saffron Design System",
};

// Popup preferences (History on/off + count, and which sections show).
// Mirrors PREF_DEFAULTS in popup.js. Kept in memory so each control writes the whole object.
const PREF_DEFAULTS = { historyEnabled: true, historyMax: 6, showLinks: true, showBookmarks: true };
let prefs = { ...PREF_DEFAULTS };

// Keep the item count within sane bounds (1–20), else fall back to the default.
function clampMax(n) {
  const v = parseInt(n, 10);
  if (Number.isNaN(v)) return PREF_DEFAULTS.historyMax;
  return Math.min(20, Math.max(1, v));
}

const orgInput = document.getElementById("org");
const projectInput = document.getElementById("project");
const areaInput = document.getElementById("area");
const saveButton = document.getElementById("save");
const resetSettingsButton = document.getElementById("resetSettings");
const settingsStatus = document.getElementById("settingsStatus");
const historyEnabledInput = document.getElementById("historyEnabled");
const historyMaxInput = document.getElementById("historyMax");
const saveHistoryButton = document.getElementById("saveHistory");
const historyStatus = document.getElementById("historyStatus");
const showLinksInput = document.getElementById("showLinks");
const showBookmarksInput = document.getElementById("showBookmarks");
const linksVisStatus = document.getElementById("linksVisStatus");
const bookmarksVisStatus = document.getElementById("bookmarksVisStatus");

// --- Settings ---
function flashStatus(el, text) {
  el.textContent = text;                             // role="status" announces the change
  setTimeout(() => { el.textContent = ""; }, 1500);
}

saveButton.addEventListener("click", () => {
  const settings = {
    org: orgInput.value.trim(),
    project: projectInput.value.trim(),
    area: areaInput.value.trim(),
  };
  chrome.storage.sync.set({ settings }, () => flashStatus(settingsStatus, "Saved"));
});

resetSettingsButton.addEventListener("click", () => {
  if (!confirm("Reset the Azure DevOps target to the original defaults?")) return;
  orgInput.value = DEFAULTS.org;
  projectInput.value = DEFAULTS.project;
  areaInput.value = DEFAULTS.area;
  chrome.storage.sync.set({ settings: { ...DEFAULTS } }, () => flashStatus(settingsStatus, "Reset to default"));
});

// --- Popup preferences (History + section visibility) ---
function persistPrefs(cb) {
  chrome.storage.sync.set({ prefs }, cb || (() => {}));
}

// The count field is only relevant when History is on — grey it out (and drop it from
// the tab order) while unchecked. This is a live UI cue; it persists on Save.
historyEnabledInput.addEventListener("change", () => {
  historyMaxInput.disabled = !historyEnabledInput.checked;
});

// History enable + count save together (the count is a typed value, like the target).
saveHistoryButton.addEventListener("click", () => {
  prefs.historyEnabled = historyEnabledInput.checked;
  prefs.historyMax = clampMax(historyMaxInput.value);
  historyMaxInput.value = prefs.historyMax;               // reflect the clamped value
  // Trim any stored history to the new count so the popup reflects it right away.
  chrome.storage.sync.get(["history"], (d) => {
    const history = Array.isArray(d.history) ? d.history.slice(0, prefs.historyMax) : [];
    chrome.storage.sync.set({ prefs, history }, () => flashStatus(historyStatus, "Saved"));
  });
});

// Section visibility toggles save immediately (single switches, no typing).
showLinksInput.addEventListener("change", () => {
  prefs.showLinks = showLinksInput.checked;
  persistPrefs(() => flashStatus(linksVisStatus, showLinksInput.checked ? "Shown in popup" : "Hidden from popup"));
});

showBookmarksInput.addEventListener("change", () => {
  prefs.showBookmarks = showBookmarksInput.checked;
  persistPrefs(() => flashStatus(bookmarksVisStatus, showBookmarksInput.checked ? "Shown in popup" : "Hidden from popup"));
});

// --- Reusable editable list (drives both Quick links and Bookmarks) ---
// storageKey doubles as the key inside links.json used to seed / reset.
function createEditableList({ storageKey, listEl, labelInput, urlInput, addButton, errorEl, resetButton }) {
  let items = [];

  function persist() {
    chrome.storage.sync.set({ [storageKey]: items });
  }

  function render() {
    listEl.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "hint";
      empty.textContent = "Nothing here yet. Add one above.";
      listEl.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "list-item";

      const meta = document.createElement("div");
      meta.className = "meta";
      const label = document.createElement("div");
      label.className = "label";
      label.textContent = item.label;
      const url = document.createElement("div");
      url.className = "url";
      url.textContent = item.url;
      meta.append(label, url);

      const remove = document.createElement("button");
      remove.className = "remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${item.label}`);
      remove.addEventListener("click", () => {
        items.splice(index, 1);
        persist();
        render();
      });

      row.append(meta, remove);
      listEl.appendChild(row);
    });
  }

  addButton.addEventListener("click", () => {
    errorEl.textContent = "";
    const label = labelInput.value.trim();
    const url = urlInput.value.trim();
    if (!label || !url) {
      errorEl.textContent = "Both a label and a URL are required.";
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      errorEl.textContent = "URL must start with http:// or https://";
      return;
    }
    items.unshift({ label, url });   // newest goes to the top
    persist();
    labelInput.value = "";
    urlInput.value = "";
    render();
  });

  resetButton.addEventListener("click", async () => {
    if (!confirm("Reset this list to the original defaults? Your customizations will be removed.")) return;
    items = await seedFromFile(storageKey);
    persist();
    render();
  });

  // Use stored items, or seed from links.json on first run.
  async function initFrom(storedItems) {
    if (Array.isArray(storedItems)) {
      items = storedItems;
    } else {
      items = await seedFromFile(storageKey);
      persist();
    }
    render();
  }

  return { initFrom };
}

async function seedFromFile(key) {
  try {
    const response = await fetch("links.json");
    const data = await response.json();
    return Array.isArray(data[key]) ? data[key] : [];
  } catch (error) {
    console.error("Could not seed from links.json:", error);
    return [];
  }
}

const quickLinks = createEditableList({
  storageKey: "links",
  listEl: document.getElementById("linkList"),
  labelInput: document.getElementById("newLinkLabel"),
  urlInput: document.getElementById("newLinkUrl"),
  addButton: document.getElementById("addLink"),
  errorEl: document.getElementById("addLinkError"),
  resetButton: document.getElementById("resetLinks"),
});

const bookmarks = createEditableList({
  storageKey: "bookmarks",
  listEl: document.getElementById("bookmarkList"),
  labelInput: document.getElementById("newLabel"),
  urlInput: document.getElementById("newUrl"),
  addButton: document.getElementById("add"),
  errorEl: document.getElementById("addError"),
  resetButton: document.getElementById("resetBookmarks"),
});

// --- Load everything when the page opens ---
function load() {
  chrome.storage.sync.get(["settings", "links", "bookmarks", "prefs"], (data) => {
    const settings = data.settings || {};
    orgInput.value = settings.org ?? DEFAULTS.org;
    projectInput.value = settings.project ?? DEFAULTS.project;
    areaInput.value = settings.area ?? DEFAULTS.area;

    prefs = {
      historyEnabled: data.prefs?.historyEnabled !== false,   // default on
      historyMax: clampMax(data.prefs?.historyMax),
      showLinks: data.prefs?.showLinks !== false,             // default on
      showBookmarks: data.prefs?.showBookmarks !== false,     // default on
    };
    historyEnabledInput.checked = prefs.historyEnabled;
    historyMaxInput.value = prefs.historyMax;
    historyMaxInput.disabled = !prefs.historyEnabled;
    showLinksInput.checked = prefs.showLinks;
    showBookmarksInput.checked = prefs.showBookmarks;

    quickLinks.initFrom(data.links);
    bookmarks.initFrom(data.bookmarks);
  });
}

load();
