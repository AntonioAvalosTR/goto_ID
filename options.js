// Human-readable defaults (raw, NOT URL-encoded — encoding happens where used).
const DEFAULTS = {
  org: "tr-design",
  project: "Design Organization",
  area: "designOrg\\Saffron Design System",
};

const orgInput = document.getElementById("org");
const projectInput = document.getElementById("project");
const areaInput = document.getElementById("area");
const saveButton = document.getElementById("save");
const settingsStatus = document.getElementById("settingsStatus");

// --- Settings ---
saveButton.addEventListener("click", () => {
  const settings = {
    org: orgInput.value.trim(),
    project: projectInput.value.trim(),
    area: areaInput.value.trim(),
  };
  chrome.storage.sync.set({ settings }, () => {
    settingsStatus.hidden = false;
    setTimeout(() => (settingsStatus.hidden = true), 1500);
  });
});

// --- Reusable editable list (drives both Quick links and Bookmarks) ---
// storageKey doubles as the key inside links.json used to seed on first run.
function createEditableList({ storageKey, listEl, labelInput, urlInput, addButton, errorEl }) {
  let items = [];

  function persist() {
    chrome.storage.sync.set({ [storageKey]: items });
  }

  function render() {
    listEl.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "Nothing here yet. Add one above.";
      listEl.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const row = document.createElement("div");
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
});

const bookmarks = createEditableList({
  storageKey: "bookmarks",
  listEl: document.getElementById("bookmarkList"),
  labelInput: document.getElementById("newLabel"),
  urlInput: document.getElementById("newUrl"),
  addButton: document.getElementById("add"),
  errorEl: document.getElementById("addError"),
});

// --- Load everything when the page opens ---
function load() {
  chrome.storage.sync.get(["settings", "links", "bookmarks"], (data) => {
    const settings = data.settings || {};
    orgInput.value = settings.org ?? DEFAULTS.org;
    projectInput.value = settings.project ?? DEFAULTS.project;
    areaInput.value = settings.area ?? DEFAULTS.area;

    quickLinks.initFrom(data.links);
    bookmarks.initFrom(data.bookmarks);
  });
}

load();
