const ORG = "tr-design";
const PROJECT = "Design%20Organization";   // already URL-encoded (contains a space)
const AREA_PATH = "designOrg\\Saffron Design System";  // not URL-encoded (contains a space)

const input = document.getElementById("wid");
const button = document.getElementById("go");
const linksContainer = document.getElementById("links");
const bookmarksToggle = document.getElementById("bookmarksToggle");
const bookmarksMenu = document.getElementById("bookmarksMenu");

// --- Open a URL in a new tab and close the popup ---
function openUrl(url) {
  chrome.tabs.create({ url });
  window.close();
}

// --- Submit: all digits => open that work item; any text => ADO search ---
function go() {
  const query = input.value.trim();
  if (!query) return;                       // nothing entered, do nothing

  let url;
  if (/^\d+$/.test(query)) {
    // Pure number: treat as a work item ID and open it directly
    url = `https://dev.azure.com/${ORG}/${PROJECT}/_workitems/edit/${query}`;
  } else {
    // Contains non-digits: run a work-item search scoped to the Saffron area path.
    // encodeURIComponent makes spaces and special characters URL-safe (space => %20).
    const keywords = encodeURIComponent(query);
    url = `https://dev.azure.com/${ORG}/${PROJECT}/_search?text=${keywords}&type=workitem&lp=workitems-Team&filters=Projects%7B${PROJECT}%7DArea%20Paths%7B${PROJECT}%5C${encodeURIComponent(AREA_PATH)}%7D&pageSize=25`;
  }
  openUrl(url);
}

button.addEventListener("click", go);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") go();              // type/paste + Enter, no mouse
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
