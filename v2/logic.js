/* Rules for aisles, quantities, and "running low?" suggestions.
   No page elements in this file, so the checks in scripts/self-check.js can run it. */
(function () {
  var SECTIONS = [
    "Produce",
    "Bakery",
    "Deli",
    "Meat & Seafood",
    "Dairy",
    "Frozen",
    "Pantry",
    "Snacks",
    "Beverages",
    "Household",
    "Personal Care",
    "Other"
  ];

  var DAY = 24 * 60 * 60 * 1000;
  var SMALL_WORDS = { and: true, or: true, of: true, the: true, with: true, a: true, an: true };
  var SKIP_PLURAL = { pop: true, ice: true };

  function normalize(name) {
    return String(name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tidyName(name) {
    var text = String(name || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    var letters = text.replace(/[^a-zA-Z]+/g, "");
    var allLower = letters && letters === letters.toLowerCase();
    var allUpper = letters && letters === letters.toUpperCase();
    if (!allLower && !allUpper) return text;
    return text.toLowerCase().split(" ").map(function (word, index) {
      if (!word) return word;
      if (index > 0 && SMALL_WORDS[word]) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function clampQty(value) {
    var qty = parseInt(value, 10);
    if (!qty || qty < 1) return 1;
    if (qty > 99) return 99;
    return qty;
  }

  function parseEntry(raw) {
    var text = String(raw || "").replace(/\s+/g, " ").trim();
    if (!text) return null;
    var qty = 1;
    var name = text;
    var match = text.match(/^(\d{1,2})\s*[x×]\s+(.+)$/i);
    if (match && /[a-z]/i.test(match[2])) {
      qty = clampQty(match[1]);
      name = match[2];
    } else {
      match = text.match(/^(.+?)\s*[x×]\s*(\d{1,2})$/i);
      if (match && /[a-z]/i.test(match[1])) {
        qty = clampQty(match[2]);
        name = match[1];
      } else {
        match = text.match(/^(\d{1,2})\s+(.+)$/);
        if (match && /[a-z]/i.test(match[2])) {
          qty = clampQty(match[1]);
          name = match[2];
        }
      }
    }
    name = tidyName(name);
    if (!name || !/[a-z]/i.test(name)) return null;
    return { name: name, qty: qty };
  }

  function escapeReg(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function pluralPhrase(phrase) {
    var parts = phrase.split(" ");
    var last = parts[parts.length - 1];
    if (!last || last.length < 3 || SKIP_PLURAL[last] || /(s|x|z|ch|sh)$/.test(last)) return null;
    var next;
    if (last === "potato" || last === "tomato") next = last + "es";
    else if (/[^aeiou]y$/.test(last)) next = last.slice(0, -1) + "ies";
    else next = last + "s";
    parts[parts.length - 1] = next;
    return parts.join(" ");
  }

  function buildIndex() {
    var source = globalThis.SECTION_KEYWORDS || {};
    var index = [];
    var seen = {};
    var duplicates = [];
    var unknownSections = [];

    Object.keys(source).forEach(function (section) {
      if (SECTIONS.indexOf(section) === -1) unknownSections.push(section);
      (source[section] || []).forEach(function (word) {
        var phrases = [normalize(word)];
        var plural = pluralPhrase(phrases[0]);
        if (plural) phrases.push(plural);
        phrases.forEach(function (phrase) {
          if (!phrase) return;
          if (seen[phrase] && seen[phrase] !== section) {
            duplicates.push(phrase + ": " + seen[phrase] + " vs " + section);
            return;
          }
          if (seen[phrase]) return;
          seen[phrase] = section;
          index.push({
            section: section,
            phrase: phrase,
            len: phrase.length,
            re: new RegExp("(?:^|\\s)" + escapeReg(phrase) + "(?:\\s|$)")
          });
        });
      });
    });

    return { index: index, duplicates: duplicates, unknownSections: unknownSections };
  }

  var built = buildIndex();

  function hasWord(name, word) {
    return new RegExp("(?:^|\\s)" + word + "(?:\\s|$)").test(name);
  }

  function guessSection(name) {
    var normalized = normalize(name);
    if (!normalized) return "Other";
    if (hasWord(normalized, "frozen")) return "Frozen";
    if (hasWord(normalized, "canned")) return "Pantry";
    if (hasWord(normalized, "deli")) return "Deli";

    var matches = [];
    for (var i = 0; i < built.index.length; i++) {
      var entry = built.index[i];
      if (normalized.indexOf(entry.phrase) === -1) continue;
      var found = entry.re.exec(normalized);
      if (!found) continue;
      matches.push({
        section: entry.section,
        len: entry.len,
        end: found.index + found[0].length
      });
    }
    if (!matches.length) return "Other";

    var suffixes = matches.filter(function (match) {
      return match.end === normalized.length;
    });
    var pool = suffixes.length ? suffixes : matches;
    pool.sort(function (a, b) { return b.len - a.len; });
    return pool[0].section;
  }

  function sectionFor(name, history) {
    var key = normalize(name);
    var entry = history && history[key];
    if (entry && entry.sectionChoice && SECTIONS.indexOf(entry.sectionChoice) !== -1) {
      return entry.sectionChoice;
    }
    return guessSection(name);
  }

  function lastPurchase(entry) {
    if (!entry || !entry.purchases || !entry.purchases.length) return 0;
    return Math.max.apply(null, entry.purchases);
  }

  function stapleStatus(entry, now) {
    if (!entry || !entry.purchases || entry.purchases.length < 2) return null;
    if (entry.dismissedUntil && now < entry.dismissedUntil) return null;

    var times = entry.purchases.slice().sort(function (a, b) { return a - b; });
    var gaps = [];
    for (var i = 1; i < times.length; i++) {
      var gap = times[i] - times[i - 1];
      if (gap >= 12 * 60 * 60 * 1000) gaps.push(gap);
    }
    if (!gaps.length) return null;
    gaps.sort(function (a, b) { return a - b; });
    var mid = Math.floor(gaps.length / 2);
    var median = gaps.length % 2 === 1 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
    if (median < 2 * DAY || median > 120 * DAY) return null;

    var since = now - times[times.length - 1];
    if (since < median) return null;
    return {
      everyDays: Math.round(median / DAY),
      agoDays: Math.max(1, Math.round(since / DAY)),
      medianMs: median
    };
  }

  function stapleSuggestions(history, items, now, limit) {
    var onList = {};
    (items || []).forEach(function (item) {
      onList[normalize(item.name)] = true;
    });
    var out = [];
    Object.keys(history || {}).forEach(function (key) {
      if (onList[key]) return;
      var entry = history[key];
      var info = stapleStatus(entry, now);
      if (!info) return;
      out.push({
        name: entry.name,
        everyDays: info.everyDays,
        agoDays: info.agoDays,
        medianMs: info.medianMs,
        overdue: info.agoDays / info.everyDays
      });
    });
    out.sort(function (a, b) { return b.overdue - a.overdue; });
    return out.slice(0, limit || 5);
  }

  function frequentItems(history, items, now, limit) {
    var onList = {};
    (items || []).forEach(function (item) {
      onList[normalize(item.name)] = true;
    });
    var stapleNames = {};
    stapleSuggestions(history, items, now, 50).forEach(function (staple) {
      stapleNames[normalize(staple.name)] = true;
    });
    return Object.keys(history || {}).map(function (key) {
      return history[key];
    }).filter(function (entry) {
      var key = normalize(entry.name);
      return entry.count >= 2 && !onList[key] && !stapleNames[key];
    }).sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      return lastPurchase(b) - lastPurchase(a);
    }).slice(0, limit || 12);
  }

  function blankEntry(name) {
    return {
      name: tidyName(name),
      count: 0,
      purchases: [],
      sectionChoice: null,
      dismissedUntil: null
    };
  }

  function recordPurchase(entry, now) {
    var token = now || Date.now();
    var purchases = (entry.purchases || []).slice();
    while (purchases.indexOf(token) !== -1) token += 1;
    purchases.push(token);
    purchases.sort(function (a, b) { return a - b; });
    if (purchases.length > 18) purchases = purchases.slice(purchases.length - 18);
    return {
      token: token,
      entry: {
        name: entry.name,
        count: (entry.count || 0) + 1,
        purchases: purchases,
        sectionChoice: entry.sectionChoice || null,
        dismissedUntil: null
      }
    };
  }

  function undoPurchase(entry, token) {
    return {
      name: entry.name,
      count: Math.max(0, (entry.count || 0) - 1),
      purchases: (entry.purchases || []).filter(function (time) { return time !== token; }),
      sectionChoice: entry.sectionChoice || null,
      dismissedUntil: entry.dismissedUntil || null
    };
  }

  function keywordAudit() {
    return {
      duplicates: built.duplicates.slice(),
      unknownSections: built.unknownSections.slice()
    };
  }

  globalThis.CartLogic = {
    SECTIONS: SECTIONS,
    DAY: DAY,
    normalize: normalize,
    tidyName: tidyName,
    parseEntry: parseEntry,
    guessSection: guessSection,
    sectionFor: sectionFor,
    stapleStatus: stapleStatus,
    stapleSuggestions: stapleSuggestions,
    frequentItems: frequentItems,
    blankEntry: blankEntry,
    recordPurchase: recordPurchase,
    undoPurchase: undoPurchase,
    keywordAudit: keywordAudit
  };
})();
