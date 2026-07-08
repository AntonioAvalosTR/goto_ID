const ORG = "tr-design";   // <-- change this
const PROJECT = "Design%20Organization";    // <-- change this

const input = document.getElementById("wid");
const button = document.getElementById("go");
const linksContainer = document.getElementById("links");
const bookmarksToggle = document.getElementById("bookmarksToggle");
const bookmarksMenu = document.getElementById("bookmarksMenu");

// --- Go to ID: build a work-item URL from the typed number ---
function goToId() {
  const id = input.value.trim();
  if (!/^\d+$/.test(id)) return;            // only proceed if it's all digits
  const url = `https://dev.azure.com/${ORG}/${PROJECT}/_workitems/edit/${id}`;
  chrome.tabs.create({ url });
  window.close();
}

button.addEventListener("click", goToId);
input.addEventListener("input", () => {
  input.value = input.value.replace(/[^0-9]/g, "");   // strip non-digits as typed
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") goToId();          // paste + Enter, no mouse
});

// --- Open a URL in a new tab and close the popup ---
function openUrl(url) {
  chrome.tabs.create({ url });
  window.close();
}

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

// --- Load everything from links.json (labels/URLs live in data, not code) ---
fetch("links.json")
  .then((response) => response.json())
  .then((data) => {
    buildButtons(data.links, linksContainer);        // quick-link row (buttons)
    buildMenuItems(data.bookmarks, bookmarksMenu);   // bookmarks dropdown (links)
  })
  .catch((error) => console.error("Could not load links.json:", error));

// --- Bookmarks dropdown open/close ---
bookmarksToggle.addEventListener("click", () => {
  const opening = bookmarksMenu.hidden;              // hidden now => we're opening it
  bookmarksMenu.hidden = !opening;
  bookmarksToggle.setAttribute("aria-expanded", String(opening));
});
