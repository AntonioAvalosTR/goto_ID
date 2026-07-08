const ORG = "your-organization";   // <-- change this
const PROJECT = "your-project";    // <-- change this

const input = document.getElementById("wid");
const button = document.getElementById("go");

function open() {
  const id = input.value.trim();
  if (!/^\d+$/.test(id)) return;   // must be one or more digits, nothing else
  const url = `https://dev.azure.com/tr-design/Design%20Organization/_workitems/edit/${id}`;
  chrome.tabs.create({ url });
  window.close();
}

button.addEventListener("click", open);
input.addEventListener("input", () => {
  input.value = input.value.replace(/[^0-9]/g, "");
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") open();   // lets you paste + hit Enter, no mouse
});

