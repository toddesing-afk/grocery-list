/* Cart v1. The list lives in this phone's browser (localStorage). No account, no server.
   dictionary.js teaches aisles. logic.js is the rules. This file is the screen. */
(function () {
  var STORAGE_KEY = "cart.v1";
  var THEME_KEY = "cart.v1.theme";
  var logic = globalThis.CartLogic;

  var state = load();
  var suggestIndex = -1;
  var editingId = null;
  var aisleItemId = null;
  var clearArmedUntil = 0;

  var main = document.getElementById("main");
  var form = document.getElementById("add-form");
  var input = document.getElementById("add-input");
  var suggestions = document.getElementById("suggestions");
  var remaining = document.getElementById("remaining");
  var live = document.getElementById("live");
  var editor = document.getElementById("editor");
  var editorForm = document.getElementById("editor-form");
  var editName = document.getElementById("edit-name");
  var editNote = document.getElementById("edit-note");
  var qtyInput = document.getElementById("qty-val");
  var aisleDialog = document.getElementById("aisle-dialog");
  var aisleFor = document.getElementById("aisle-for");
  var aisleOptions = document.getElementById("aisle-options");

  function emptyState() {
    return { schema: 1, items: [], history: {}, inCartOpen: false, tipDismissed: false };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.items) || !data.history || typeof data.history !== "object") return emptyState();
      data.items = data.items.filter(function (item) {
        return item && item.id && item.name;
      }).map(function (item) {
        var qty = parseInt(item.qty, 10);
        item.qty = qty >= 1 && qty <= 99 ? qty : 1;
        item.note = item.note || "";
        item.section = item.section || "Other";
        item.checked = !!item.checked;
        item.sectionManual = !!item.sectionManual;
        return item;
      });
      return {
        schema: 1,
        items: data.items,
        history: data.history,
        inCartOpen: !!data.inCartOpen,
        tipDismissed: !!data.tipDismissed
      };
    } catch (err) {
      return emptyState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      var warning = document.getElementById("save-warning");
      if (warning) warning.hidden = false;
    }
  }

  function announce(text) {
    live.textContent = "";
    window.setTimeout(function () { live.textContent = text; }, 30);
  }

  function uid() {
    if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function findItem(id) {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].id === id) return state.items[i];
    }
    return null;
  }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    (children || []).forEach(function (child) {
      if (child == null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function choice() {
    try { return localStorage.getItem(THEME_KEY) || "system"; } catch (err) { return "system"; }
  }

  function resolvedTheme() {
    var picked = choice();
    if (picked === "dark" || picked === "light") return picked;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#18241e" : "#1e4d3c");
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    var next = mode === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", "Switch to " + next + " mode");
    button.setAttribute("title", "Switch to " + next + " mode");
  }

  function ensureEntry(name) {
    var key = logic.normalize(name);
    var entry = state.history[key] || logic.blankEntry(name);
    entry.name = logic.tidyName(name) || entry.name;
    state.history[key] = entry;
    return entry;
  }

  function rememberSection(name, section) {
    var key = logic.normalize(name);
    if (!key) return;
    var entry = state.history[key] || logic.blankEntry(name);
    entry.name = logic.tidyName(name) || entry.name;
    entry.sectionChoice = section;
    state.history[key] = entry;
  }

  function addItem(name, qty) {
    var tidy = logic.tidyName(name);
    var key = logic.normalize(tidy);
    if (!key) return;
    var amount = qty >= 1 ? Math.min(99, qty) : 1;
    var existing = null;
    state.items.forEach(function (item) {
      if (!item.checked && logic.normalize(item.name) === key) existing = item;
    });
    var id;
    if (existing) {
      existing.qty = Math.min(99, existing.qty + amount);
      id = existing.id;
      announce(existing.name + " quantity is " + existing.qty + ".");
    } else {
      var manual = !!(state.history[key] && logic.SECTIONS.indexOf(state.history[key].sectionChoice) !== -1);
      var item = {
        id: uid(),
        name: tidy,
        qty: amount,
        note: "",
        section: manual ? state.history[key].sectionChoice : logic.guessSection(tidy),
        sectionManual: manual,
        checked: false,
        addedAt: Date.now(),
        checkedAt: null,
        purchaseToken: null
      };
      state.items.push(item);
      id = item.id;
      announce("Added " + tidy + ".");
    }
    save();
    render({ flashId: id });
  }

  function toggleChecked(id) {
    var item = findItem(id);
    if (!item) return;
    var key = logic.normalize(item.name);
    if (!item.checked) {
      var recorded = logic.recordPurchase(ensureEntry(item.name), Date.now());
      state.history[key] = recorded.entry;
      item.checked = true;
      item.checkedAt = recorded.token;
      item.purchaseToken = recorded.token;
      state.inCartOpen = true;
      announce(item.name + " moved to In cart.");
    } else {
      if (item.purchaseToken && state.history[key]) {
        state.history[key] = logic.undoPurchase(state.history[key], item.purchaseToken);
      }
      item.checked = false;
      item.checkedAt = null;
      item.purchaseToken = null;
      announce(item.name + " returned to the list.");
    }
    save();
    render({ focusId: id });
  }

  function armOrClear() {
    var checked = state.items.filter(function (item) { return item.checked; });
    if (!checked.length) return;
    if (Date.now() > clearArmedUntil) {
      clearArmedUntil = Date.now() + 4000;
      render();
      window.setTimeout(function () {
        if (Date.now() >= clearArmedUntil) {
          clearArmedUntil = 0;
          render();
        }
      }, 4100);
      return;
    }
    clearArmedUntil = 0;
    state.items = state.items.filter(function (item) { return !item.checked; });
    state.inCartOpen = false;
    save();
    render();
    announce("Cleared " + checked.length + (checked.length === 1 ? " checked item." : " checked items."));
  }

  function dismissStaple(name) {
    var key = logic.normalize(name);
    var entry = state.history[key];
    if (!entry) return;
    var info = logic.stapleStatus(entry, Date.now());
    entry.dismissedUntil = Date.now() + (info ? info.medianMs : 7 * logic.DAY);
    save();
    render();
    announce("Hid " + entry.name + " for now.");
  }

  function everyLabel(days) {
    return days <= 1 ? "every day" : "every " + days + " days";
  }

  function agoLabel(days) {
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    return days + " days ago";
  }

  function itemRow(item, flashId) {
    var checkbox = el("input", {
      type: "checkbox",
      "data-action": "check",
      "data-id": item.id,
      "aria-label": item.checked ? "Return " + item.name + " to the list" : "Mark " + item.name + " in cart"
    });
    if (item.checked) checkbox.checked = true;
    var nameBtn = el("button", {
      type: "button",
      class: "name-btn",
      "data-action": "edit",
      "data-id": item.id,
      "aria-label": "Edit " + item.name
    });
    nameBtn.appendChild(el("span", { class: "name", text: item.name }));
    if (item.note) nameBtn.appendChild(el("span", { class: "note", text: item.note }));
    var row = el("li", {
      class: "item" + (item.checked ? " is-checked" : "") + (flashId === item.id ? " flash" : "")
    });
    row.setAttribute("data-item-id", item.id);
    row.setAttribute("data-section", item.section);
    row.appendChild(el("label", { class: "check" }, [
      checkbox,
      el("span", { class: "box", "aria-hidden": "true" })
    ]));
    row.appendChild(nameBtn);
    row.appendChild(el("button", {
      type: "button",
      class: "qty-btn",
      "data-action": "edit",
      "data-id": item.id,
      "aria-label": "Quantity " + item.qty + ". Edit " + item.name,
      text: "×" + item.qty
    }));
    row.appendChild(el("button", {
      type: "button",
      class: "aisle-btn",
      "data-action": "aisle",
      "data-id": item.id,
      "aria-label": "Aisle for " + item.name + ": " + item.section + ". Change aisle."
    }, [
      el("span", { text: item.section }),
      el("span", { class: "chev", "aria-hidden": "true", text: "▾" })
    ]));
    return row;
  }

  function renderRemaining() {
    var left = state.items.filter(function (item) { return !item.checked; }).length;
    if (!state.items.length) remaining.textContent = "Nothing to get yet";
    else if (!left) remaining.textContent = "All in the cart";
    else remaining.textContent = left === 1 ? "1 to get" : left + " to get";
  }

  function renderTip() {
    var tip = document.getElementById("tip");
    var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    tip.hidden = !!(state.tipDismissed || standalone);
  }

  function renderSuggestions() {
    var query = input.value.trim();
    var matches = [];
    var needle = logic.normalize(query);
    if (needle) {
      matches = Object.keys(state.history).map(function (key) {
        return state.history[key];
      }).filter(function (entry) {
        return entry.count > 0 && logic.normalize(entry.name).indexOf(needle) !== -1;
      }).sort(function (a, b) {
        var aStart = logic.normalize(a.name).indexOf(needle) === 0 ? 0 : 1;
        var bStart = logic.normalize(b.name).indexOf(needle) === 0 ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        if (b.count !== a.count) return b.count - a.count;
        return logic.normalize(a.name).localeCompare(logic.normalize(b.name));
      }).slice(0, 6);
    }
    clear(suggestions);
    if (!matches.length) {
      suggestions.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      suggestIndex = -1;
      return;
    }
    suggestions.hidden = false;
    input.setAttribute("aria-expanded", "true");
    if (suggestIndex >= matches.length) suggestIndex = matches.length - 1;
    matches.forEach(function (entry, index) {
      var button = el("button", {
        type: "button",
        role: "option",
        id: "suggest-" + index,
        "data-name": entry.name,
        "aria-selected": index === suggestIndex ? "true" : "false"
      });
      if (index === suggestIndex) button.className = "is-active";
      button.appendChild(el("span", { class: "suggest-name", text: entry.name }));
      button.appendChild(el("span", {
        class: "suggest-meta",
        text: entry.count === 1 ? "1 time" : entry.count + " times"
      }));
      suggestions.appendChild(button);
    });
    if (suggestIndex >= 0) input.setAttribute("aria-activedescendant", "suggest-" + suggestIndex);
    else input.removeAttribute("aria-activedescendant");
  }

  function render(opts) {
    opts = opts || {};
    renderRemaining();
    renderTip();
    clear(main);
    var now = Date.now();
    var staples = logic.stapleSuggestions(state.history, state.items, now, 5);
    var frequent = logic.frequentItems(state.history, state.items, now, 12);

    if (staples.length) {
      var low = el("section", { class: "block", "aria-label": "Running low" });
      low.appendChild(el("h2", { text: "Running low?" }));
      low.appendChild(el("p", { class: "hint", text: "Shown when the usual gap between purchases has passed." }));
      staples.forEach(function (staple) {
        var card = el("article", { class: "low-card" });
        card.appendChild(el("h3", { text: staple.name }));
        card.appendChild(el("p", {
          text: "Usually " + everyLabel(staple.everyDays) + " · last bought " + agoLabel(staple.agoDays)
        }));
        card.appendChild(el("div", { class: "low-actions" }, [
          el("button", {
            type: "button",
            class: "add-fill",
            "data-action": "quick-add",
            "data-name": staple.name,
            text: "Add"
          }),
          el("button", {
            type: "button",
            class: "ghost",
            "data-action": "dismiss-staple",
            "data-name": staple.name,
            text: "Not now"
          })
        ]));
        low.appendChild(card);
      });
      main.appendChild(low);
    }

    if (frequent.length) {
      var fav = el("section", { class: "block", "aria-label": "Frequent items" });
      fav.appendChild(el("h2", { text: "Frequent" }));
      var chips = el("div", { class: "chips" });
      frequent.forEach(function (entry) {
        chips.appendChild(el("button", {
          type: "button",
          class: "chip",
          "data-action": "quick-add",
          "data-name": entry.name,
          text: "+ " + entry.name
        }));
      });
      fav.appendChild(chips);
      main.appendChild(fav);
    }

    var unchecked = state.items.filter(function (item) { return !item.checked; })
      .sort(function (a, b) { return a.addedAt - b.addedAt; });
    var checked = state.items.filter(function (item) { return item.checked; })
      .sort(function (a, b) { return (b.checkedAt || 0) - (a.checkedAt || 0); });

    if (!unchecked.length && !checked.length) {
      var empty = el("div", { class: "empty" });
      empty.appendChild(cartGlyph());
      empty.appendChild(el("p", { class: "empty-title", text: "Nothing on the list yet." }));
      empty.appendChild(el("p", { text: "Add what you need. Cart sorts it by aisle and remembers what you buy." }));
      main.appendChild(empty);
    } else if (!unchecked.length) {
      main.appendChild(el("p", { class: "all-set", text: "That's everything." }));
    } else {
      var groups = {};
      logic.SECTIONS.forEach(function (section) { groups[section] = []; });
      unchecked.forEach(function (item) {
        var section = logic.SECTIONS.indexOf(item.section) === -1 ? "Other" : item.section;
        groups[section].push(item);
      });
      logic.SECTIONS.forEach(function (section) {
        if (!groups[section].length) return;
        var group = el("section", { class: "group" });
        group.appendChild(el("h2", { text: section }));
        var list = el("ul");
        groups[section].forEach(function (item) { list.appendChild(itemRow(item, opts.flashId)); });
        group.appendChild(list);
        main.appendChild(group);
      });
    }

    if (checked.length) {
      var wrap = el("section", { class: "incart" + (state.inCartOpen ? " is-open" : ""), "aria-label": "In cart" });
      var toggle = el("button", {
        type: "button",
        class: "incart-toggle",
        "data-action": "toggle-cart",
        "aria-expanded": state.inCartOpen ? "true" : "false",
        "aria-controls": "incart-panel"
      }, [
        el("span", { text: "In cart" }),
        el("span", { class: "count", text: String(checked.length) }),
        el("span", { class: "chev", "aria-hidden": "true", text: "▾" })
      ]);
      var panel = el("div", { id: "incart-panel" });
      if (!state.inCartOpen) panel.hidden = true;
      var armed = Date.now() < clearArmedUntil;
      panel.appendChild(el("button", {
        type: "button",
        class: "clear-btn" + (armed ? " is-armed" : ""),
        "data-action": "clear",
        text: armed ? "Clear " + checked.length + (checked.length === 1 ? " item?" : " items?") : "Clear checked"
      }));
      var cartList = el("ul");
      checked.forEach(function (item) { cartList.appendChild(itemRow(item, opts.flashId)); });
      panel.appendChild(cartList);
      wrap.appendChild(toggle);
      wrap.appendChild(panel);
      main.appendChild(wrap);
    }

    if (opts.focusId) {
      var focus = main.querySelector('[data-action="check"][data-id="' + cssEscape(opts.focusId) + '"]');
      if (focus) focus.focus();
    }
    if (opts.flashId) {
      var row = main.querySelector('[data-item-id="' + cssEscape(opts.flashId) + '"]');
      if (row && row.scrollIntoView) {
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        row.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
      }
    }
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/"/g, "");
  }

  function cartGlyph() {
    var wrap = el("div", { class: "empty-icon", "aria-hidden": "true" });
    wrap.innerHTML = '<svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16h8l5 28h24"/><path d="M22 24h30l-4 14H24"/><circle cx="30" cy="50" r="3" fill="currentColor" stroke="none"/><circle cx="46" cy="50" r="3" fill="currentColor" stroke="none"/><path d="M44 14c7-8 16-6 16 1-7 1-13 6-16 11 0-4 0-8 0-12z" fill="currentColor" stroke="none"/></svg>';
    return wrap;
  }

  function applyEditor(tidy) {
    var item = findItem(editingId);
    if (!item) return;
    var raw = editName.value.replace(/\s+/g, " ").trim();
    if (raw) {
      item.name = tidy ? logic.tidyName(raw) : raw;
      if (tidy) editName.value = item.name;
      if (item.sectionManual) {
        if (tidy) rememberSection(item.name, item.section);
      } else {
        item.section = logic.guessSection(item.name);
      }
    }
    item.note = editNote.value.trim().slice(0, 140);
    var qty = parseInt(qtyInput.value, 10);
    if (qty >= 1 && qty <= 99) item.qty = qty;
    else if (document.activeElement !== qtyInput) qtyInput.value = item.qty;
    save();
  }

  function openEditor(id) {
    var item = findItem(id);
    if (!item) return;
    editingId = id;
    editName.value = item.name;
    editNote.value = item.note || "";
    qtyInput.value = item.qty;
    if (!editor.open) editor.showModal();
    document.getElementById("edit-done").focus();
  }

  function openAisle(id) {
    var item = findItem(id);
    if (!item) return;
    aisleItemId = id;
    aisleFor.textContent = item.name;
    clear(aisleOptions);
    logic.SECTIONS.forEach(function (section) {
      var current = section === item.section;
      var button = el("button", {
        type: "button",
        class: "aisle-choice" + (current ? " is-current" : ""),
        text: (current ? "✓ " : "") + section
      });
      if (current) button.setAttribute("aria-current", "true");
      button.addEventListener("click", function () { chooseAisle(section); });
      aisleOptions.appendChild(button);
    });
    if (!aisleDialog.open) aisleDialog.showModal();
    var marked = aisleOptions.querySelector("[aria-current='true']");
    if (marked) marked.focus();
  }

  function chooseAisle(section) {
    var item = findItem(aisleItemId);
    if (!item) {
      aisleDialog.close();
      return;
    }
    item.section = section;
    item.sectionManual = true;
    rememberSection(item.name, section);
    save();
    aisleDialog.close();
    render();
    announce(item.name + " set to " + section + ".");
  }

  function bumpQty(delta) {
    applyEditor(false);
    var item = findItem(editingId);
    if (!item) return;
    item.qty = Math.min(99, Math.max(1, item.qty + delta));
    qtyInput.value = item.qty;
    save();
    render();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var buttons = suggestions.querySelectorAll("button");
    if (suggestIndex >= 0 && buttons[suggestIndex]) {
      addItem(buttons[suggestIndex].getAttribute("data-name"), 1);
    } else {
      var parsed = logic.parseEntry(input.value);
      if (!parsed) {
        input.value = "";
        renderSuggestions();
        return;
      }
      addItem(parsed.name, parsed.qty);
    }
    input.value = "";
    suggestIndex = -1;
    renderSuggestions();
    input.focus();
  });

  input.addEventListener("input", function () {
    suggestIndex = -1;
    renderSuggestions();
  });

  input.addEventListener("keydown", function (event) {
    var buttons = suggestions.querySelectorAll("button");
    if (!buttons.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      suggestIndex = (suggestIndex + 1) % buttons.length;
      renderSuggestions();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      suggestIndex = suggestIndex <= 0 ? buttons.length - 1 : suggestIndex - 1;
      renderSuggestions();
    } else if (event.key === "Escape") {
      suggestIndex = -1;
      renderSuggestions();
    }
  });

  suggestions.addEventListener("mousedown", function (event) {
    if (event.target.closest("button")) event.preventDefault();
  });

  suggestions.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;
    addItem(button.getAttribute("data-name"), 1);
    input.value = "";
    suggestIndex = -1;
    renderSuggestions();
    input.focus();
  });

  main.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button || !main.contains(button)) return;
    var action = button.getAttribute("data-action");
    var id = button.getAttribute("data-id");
    if (action === "edit") openEditor(id);
    else if (action === "aisle") openAisle(id);
    else if (action === "toggle-cart") {
      state.inCartOpen = !state.inCartOpen;
      save();
      render();
    } else if (action === "clear") armOrClear();
    else if (action === "quick-add") addItem(button.getAttribute("data-name"), 1);
    else if (action === "dismiss-staple") dismissStaple(button.getAttribute("data-name"));
  });

  main.addEventListener("change", function (event) {
    if (event.target.getAttribute("data-action") === "check") {
      toggleChecked(event.target.getAttribute("data-id"));
    }
  });

  document.getElementById("theme-toggle").addEventListener("click", function () {
    var next = resolvedTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
    applyTheme(next);
  });

  document.getElementById("tip-dismiss").addEventListener("click", function () {
    state.tipDismissed = true;
    save();
    renderTip();
  });

  editName.addEventListener("input", function () { applyEditor(false); render(); });
  editNote.addEventListener("input", function () { applyEditor(false); render(); });
  qtyInput.addEventListener("input", function () { applyEditor(false); render(); });
  document.getElementById("qty-dec").addEventListener("click", function () { bumpQty(-1); });
  document.getElementById("qty-inc").addEventListener("click", function () { bumpQty(1); });

  editorForm.addEventListener("submit", function (event) {
    event.preventDefault();
    editor.close();
  });

  editor.addEventListener("close", function () {
    if (editingId) {
      applyEditor(true);
      editingId = null;
    }
    render();
  });

  document.getElementById("edit-delete").addEventListener("click", function () {
    var item = findItem(editingId);
    if (!item) return;
    var name = item.name;
    state.items = state.items.filter(function (it) { return it.id !== item.id; });
    editingId = null;
    save();
    if (editor.open) editor.close();
    render();
    announce("Deleted " + name + ".");
  });

  document.getElementById("aisle-cancel").addEventListener("click", function () {
    aisleDialog.close();
  });

  [editor, aisleDialog].forEach(function (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (choice() === "system") applyTheme(resolvedTheme());
  });

  if ("serviceWorker" in navigator) {
    var script = document.querySelector('script[src$="app.js"]');
    var appUrl = new URL(script.getAttribute("src"), window.location.href);
    var workerUrl = new URL("sw.js", appUrl);
    navigator.serviceWorker.register(workerUrl.href, {
      scope: new URL("./", workerUrl).href,
      updateViaCache: "none"
    }).catch(function () {});
  }

  applyTheme(resolvedTheme());
  render();
})();
