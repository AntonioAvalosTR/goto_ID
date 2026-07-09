# Building Your Own Browser Tools: A Guide for Technical Managers

*A plain-language guide to what browser extensions are, how they're built, where they stop, and how you can build your own small ones with AI — no developer background required, just a technical mindset.*

---

## Who this is for

You understand systems, data, and workflows. You may read code without writing it. You spend real time inside tools like Azure DevOps, SharePoint, and Teams, and you notice the repetitive clicks that eat your day. This guide shows you what a browser extension actually is under the hood, so that the next time you think *"I wish there were a button that just did X,"* you know it's within reach — and you can get an AI to build it with you in an afternoon.

We'll use a real example the team already built: **Go to ID**, a one-button extension that opens an ADO work item straight from its ID number. Everything abstract will point back to it.

---

## Part 1 — What a browser extension actually is

Strip away the mystique and an extension is this: **a small bundle of web-page files that your browser agrees to run in a privileged spot** — the toolbar, or layered on top of pages you visit.

That's the whole idea. The same three ingredients that make up any web page (a structure file, a style file, and a logic file) make up an extension. The only difference is *where* the browser lets them run and *what* it lets them touch.

A useful mental model: **a normal web page lives at an address you visit. An extension lives inside the browser itself.** Because it lives inside, it can add a button next to the address bar, react to pages you open, and stitch together actions across sites — things a regular page can't do from the outside.

Extensions are written in the ordinary languages of the web:

- **HTML** — the *structure*: what elements exist (a text box, a button, a heading). Think of it as the skeleton.
- **CSS** — the *styling*: sizes, colors, spacing. The clothing on the skeleton.
- **JavaScript (JS)** — the *behavior*: what happens when you click or type. The muscles that make it move.

If you've ever seen these three words and felt they belonged to "developer territory," the reassuring truth is that for a small personal tool, each file is often only a dozen lines long. Go to ID is under 40 lines of actual logic total.

---

## Part 2 — The anatomy, using Go to ID

Every extension needs one required file plus whatever it uses to do its job. Here's the full cast for Go to ID, and what each part is *for*.

### The manifest — the extension's ID card

`manifest.json` is the one file every extension must have. It doesn't *do* anything itself; it **declares** things to the browser: the extension's name, its version, its icons, and — crucially — what it's allowed to do and which file to show when clicked.

```json
{
  "manifest_version": 3,
  "name": "Go to ID",
  "version": "1.0",
  "description": "Paste a work item's ID and jump straight to it in Azure DevOps.",
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icon16.png", "32": "icon32.png" }
  },
  "icons": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" }
}
```

Reading it like a manager reads a spec: *"I'm called Go to ID, I'm version 1.0, here are my icons, and when someone clicks me, show them `popup.html`."* The `"manifest_version": 3` line is just the browser's current rulebook edition — think of it like "this document follows the 2026 policy," not something you tune.

The manifest is also where **permissions** are declared — the extension has to *ask* for anything sensitive, and the browser (and the user) can see exactly what it asked for. Go to ID asks for almost nothing, which is why it's so safe. More on that in the limitations section.

### The popup — the face

`popup.html` is the little panel that appears when you click the toolbar button. It's a miniature web page. For Go to ID, it's just a text box and a button:

```html
<input id="wid" type="text" inputmode="numeric" placeholder="Work item ID" autofocus>
<button id="go">Go to ID</button>
<script src="popup.js"></script>
```

The `id="wid"` and `id="go"` are just **name tags** so the logic file can find these two elements later. The last line plugs in the brain.

### The logic — the brain

`popup.js` is where the actual behavior lives. In Go to ID it does three small jobs:

```js
function go() {
  const id = input.value.trim();
  if (!/^\d+$/.test(id)) return;                     // 1. only proceed if it's all digits
  const url = `https://dev.azure.com/tr-design/Design%20Organization/_workitems/edit/${id}`;
  chrome.tabs.create({ url });                       // 2. open the built URL in a new tab
}

input.addEventListener("input", () => {              // 3. strip any non-digit as it's typed
  input.value = input.value.replace(/[^0-9]/g, "");
});
```

In prose: *take what's typed, refuse it unless it's purely numbers, glue that number onto the ADO address, and open it.* The `chrome.tabs.create` line is the one "superpower" a normal web page doesn't have — it's the extension reaching into the browser to open a tab. That ability comes from being an extension, not a page.

### The icons — the wardrobe

The four PNG files are just the picture shown on the toolbar and settings pages at different sizes. Purely cosmetic; the extension works fine with a single image or even none.

**That's the entire thing.** An ID card, a face, a brain, and a wardrobe. Once you see that shape, most simple extensions look the same — the logic file just does a different small job.

---

## Part 3 — How it gets into the browser

There are two ways an extension reaches a browser, and the difference matters for managers thinking about rollout.

**Loaded unpacked (what the team does).** You point Chrome at the folder of files and it runs them directly. This is instant, free, private, and needs no approval — but each person installs it themselves via `chrome://extensions` → Developer mode → *Load unpacked*. Perfect for a small team tool. Chrome may occasionally ask users to re-confirm developer-mode extensions after a restart.

**Published to the Chrome Web Store.** You package and submit it; Google reviews it; users install with one click and get automatic updates. This is the route for wide, non-technical distribution — but it involves a developer account, a review process, and public listing (or a private/unlisted enterprise arrangement). Overkill for an internal button; the right call if hundreds of people need it with zero setup.

For most management-team experiments, **unpacked is the sweet spot**: build it, share the folder or a Git repo, done.

---

## Part 4 — The limitations (read this before you dream too big)

Extensions are powerful for their size, but they live inside guardrails. Knowing the fences saves you from planning something that can't work.

**They live in the browser only.** An extension can't open your desktop apps, read local files off your hard drive on its own, or run when the browser is closed. If the workflow leaves the browser, an extension isn't the tool.

**They are sandboxed and permission-gated.** An extension can only touch what its manifest declares and what the user approves. It can't silently read every site you visit or harvest passwords. This is a *feature* — but it means anything ambitious (reading data from a page, talking to an internal API) requires explicit permissions, and your security team will rightly care about those. A tool that only builds a URL and opens it (like Go to ID) touches nothing sensitive, which is why it's uncontroversial.

**Corporate policy can block them.** Managed browsers often restrict which extensions can be installed, or disable developer mode entirely. Check with IT before assuming an unpacked extension will run on locked-down machines — this is the most common reason a good idea stalls.

**They break when the site changes.** If an extension reaches *into* a page (say, reading values off the ADO board), it depends on that page's structure. When the vendor redesigns the page, the extension can quietly stop working. Tools that only *link out* (again, Go to ID) are far more durable than tools that *read in*.

**Someone has to maintain them.** Even a 40-line tool is code. When URLs change, when Chrome updates its rulebook (the manifest version), when a coworker hits an edge case — someone owns the fix. For a personal tool that's fine; for something a whole team depends on, treat it like any small internal product, with an owner and a repo.

**They are not a substitute for real integrations.** For anything involving sensitive data, authentication, or business-critical reliability, a sanctioned integration or the vendor's own API is the correct path. Extensions shine for **personal convenience and friction removal**, not for systems of record.

---

## Part 5 — What this unlocks for a management role

The reason this is worth your attention: the tools that save managers time are usually *small*, and small is exactly what's now achievable. Some realistic patterns, in rising order of ambition:

**Link builders (safest, most durable).** Like Go to ID — turn an identifier into a destination. A button that opens a Confluence page, a PitchBook company, a SharePoint folder, or a specific saved ADO query from a short input. Zero permissions, near-zero maintenance.

**Launch pads.** A popup with your ten most-used destinations as buttons — the current sprint board, the OKR tracker, the triage query, the release checklist. Replaces a cluttered bookmarks bar with one deliberate panel.

**Query jumpers.** A dropdown that opens the right pre-built ADO query — *"items tagged mgmt-triage not yet reviewed,"* *"my team's current-sprint stories"* — without hunting through the ADO UI. Encodes your team's conventions into one click.

**Formatters and cheat sheets.** A popup that shows your team's tag glossary, or that formats a work-item reference into the `#ID, Assignee, State` convention on demand.

**Page-aware helpers (more ambitious, needs permissions).** Extensions that read the page you're on — e.g. "grab every work-item ID visible on this board and give me a clean list." Genuinely useful, but this is where permissions, maintenance, and IT review enter, so scope it deliberately.

The honest framing for your peers: **the win isn't any single tool — it's that the cost of building a small tool has collapsed.** When a bespoke button takes an afternoon instead of a sprint, it becomes reasonable to build things you'd never have requested from engineering. That changes what's worth automating.

---

## Part 6 — How to build your own, with AI as your pair

You don't need to learn to code. You need to describe clearly, test, and iterate — skills you already have. Here's the loop that actually works.

**1. Describe the tool in plain terms, plus its constraints.** The clearer the "what" and "where," the better the result. A strong first prompt to an AI names the *inputs*, the *action*, and the *environment*. For example:

> *"Help me build a simple local Chrome extension (Manifest V3, loaded unpacked). It should show a popup with a dropdown of three saved Azure DevOps queries. When I pick one, it opens that query's URL in a new tab. I'll paste the three URLs. Give me the full files and tell me exactly where to put them."*

**2. Get the full files, not fragments.** Ask for complete `manifest.json`, `popup.html`, and `popup.js` you can paste as-is. Ask the AI to explain each file in one line so you understand what you're installing.

**3. Load it unpacked and test.** `chrome://extensions` → Developer mode on → *Load unpacked* → pick the folder. Click the button. It either works or it doesn't.

**4. Iterate by describing the gap.** When something's off, tell the AI what you saw versus what you wanted — *"it opened the wrong tab"* / *"the dropdown is empty"* / *"can it open in a new window instead."* Reload the extension (circular-arrow icon on its card) after each change. This describe → test → refine loop is the whole craft.

**5. Know when to stop and ask a human.** If the tool needs to read data off a page, touch an internal API, handle credentials, or go to more than a handful of people, that's the moment to loop in a developer or IT — you've crossed from "personal convenience" into "software that needs an owner and a security look."

### A reusable starter prompt

Keep this and fill in the blanks:

> *"Build me a simple local Chrome extension, Manifest V3, to be loaded unpacked (not published). Purpose: **[what it should do in one sentence]**. Inputs: **[what I type or pick]**. Action when triggered: **[open a URL / show info / etc.]**. Environment: **[which site or context]**. Please give me the complete manifest.json, popup.html, and popup.js, a one-line explanation of each, and step-by-step install instructions. Keep it to the minimum permissions needed."*

The "minimum permissions needed" clause matters — it keeps your tool in the safe, uncontroversial zone and makes any future IT conversation easy.

---

## TL;DR

| Question | Short answer |
| --- | --- |
| **What is an extension?** | A small bundle of web files the browser runs in a privileged spot (toolbar / on top of pages). |
| **What's it made of?** | A manifest (ID card), optional HTML (face), CSS (styling), JS (brain), and icons (wardrobe). |
| **How do you install a personal one?** | `chrome://extensions` → Developer mode → *Load unpacked*. No store, no cost, no approval. |
| **Biggest limitations?** | Browser-only, permission-gated, can break when sites change, may be blocked by corporate policy, and need an owner to maintain. |
| **Safest, most durable type?** | "Link builders" that turn an ID or choice into a URL and open it — zero sensitive access (e.g. Go to ID). |
| **When to call a developer/IT?** | When it reads page data, touches an API, handles credentials, or ships to many people. |
| **How do I build one?** | Describe it clearly to an AI → get full files → load unpacked → test → iterate. An afternoon, not a sprint. |

**The one idea to keep:** the cost of a small, bespoke browser tool has dropped to near zero. The skill that now matters isn't coding — it's spotting the repetitive click and describing the fix clearly.
