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

const newLabel = document.getElementById("newLabel");
const newUrl = document.getElementById("newUrl");
const addButton = document.getElementById("add");
const addError = document.getElementById("addError");
const bookmarkList = document.getElementById("bookmarkList");

let bookmarks = [];

// --- Load settings + bookmarks when the page opens ---
function load() {
  chrome.storage.sync.get(["settings", "bookmarks"], async (data) => {
    const settings = data.settings || {};
    orgInput.value = settings.org ?? DEFAULTS.org;
    projectInput.value = settings.project ?? DEFAULTS.project;
    areaInput.value = settings.area ?? DEFAULTS.area;

    if (Array.isArray(data.bookmarks)) {
      bookmarks = data.bookmarks;
    } else {
      // First run: seed from the bundled links.json so existing bookmarks show up
      bookmarks = await seedBookmarksFromFile();
      saveBookmarks();
    }
    renderBookmarks();
  });
}

async function seedBookmarksFromFile() {
  try {
    const response = await fetch("links.json");
    const data = await response.json();
    return Array.isArray(data.bookmarks) ? data.bookmarks : [];
  } catch (error) {
    console.error("Could not seed bookmarks from links.json:", error);
    return [];
  }
}

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

// --- Bookmarks ---
function saveBookmarks() {
  chrome.storage.sync.set({ bookmarks });
}

function renderBookmarks() {
  bookmarkList.innerHTML = "";
  if (bookmarks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No bookmarks yet. Add one above.";
    bookmarkList.appendChild(empty);
    return;
  }
  bookmarks.forEach((bm, index) => {
    const row = document.createElement("div");
    row.className = "bookmark";

    const meta = document.createElement("div");
    meta.className = "meta";
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = bm.label;
    const url = document.createElement("div");
    url.className = "url";
    url.textContent = bm.url;
    meta.append(label, url);

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      bookmarks.splice(index, 1);
      saveBookmarks();
      renderBookmarks();
    });

    row.append(meta, remove);
    bookmarkList.appendChild(row);
  });
}

addButton.addEventListener("click", () => {
  addError.textContent = "";
  const label = newLabel.value.trim();
  const url = newUrl.value.trim();

  if (!label || !url) {
    addError.textContent = "Both a label and a URL are required.";
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    addError.textContent = "URL must start with http:// or https://";
    return;
  }

  bookmarks.unshift({ label, url });   // newest goes to the top
  saveBookmarks();
  newLabel.value = "";
  newUrl.value = "";
  renderBookmarks();
});

load();
