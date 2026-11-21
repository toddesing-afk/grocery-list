/* Plain checks for aisle guesses and the running-low rule. Run: node scripts/self-check.js */
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
require(path.join(root, "v1/dictionary.js"));
require(path.join(root, "v1/logic.js"));

var logic = globalThis.CartLogic;
var failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error("FAIL " + message);
  }
}

function eq(actual, expected, message) {
  assert(actual === expected, message + " (got " + JSON.stringify(actual) + ")");
}

var audit = logic.keywordAudit();
assert(audit.duplicates.length === 0, "duplicate aisle words: " + audit.duplicates.join("; "));
assert(audit.unknownSections.length === 0, "unknown aisles: " + audit.unknownSections.join("; "));

var guesses = {
  "milk": "Dairy",
  "2% milk": "Dairy",
  "almond milk": "Beverages",
  "oat milk": "Beverages",
  "chocolate milk": "Dairy",
  "milk chocolate": "Snacks",
  "chicken": "Meat & Seafood",
  "chicken broth": "Pantry",
  "chicken nuggets": "Frozen",
  "dish soap": "Household",
  "hand soap": "Personal Care",
  "shampoo": "Personal Care",
  "ice cream": "Frozen",
  "olive oil": "Pantry",
  "green beans": "Produce",
  "hamburger buns": "Bakery",
  "chocolate chips": "Pantry",
  "chips": "Snacks",
  "sour cream and onion chips": "Snacks",
  "xyzzy": "Other",
  "frozen peas": "Frozen",
  "canned tuna": "Pantry",
  "tuna": "Pantry",
  "tuna steak": "Meat & Seafood",
  "bread": "Bakery",
  "garlic bread": "Bakery",
  "eggs": "Dairy",
  "egg salad": "Deli",
  "potato salad": "Deli",
  "potato": "Produce",
  "potato chips": "Snacks",
  "orange": "Produce",
  "orange juice": "Beverages",
  "apple cider vinegar": "Pantry",
  "apple cider": "Beverages",
  "apple": "Produce",
  "peanut butter": "Pantry",
  "peanut butter cups": "Snacks",
  "butter": "Dairy",
  "butter lettuce": "Produce",
  "salad": "Produce",
  "salad dressing": "Pantry",
  "cheese": "Dairy",
  "cheese sauce": "Pantry",
  "mozzarella sticks": "Frozen",
  "mozzarella": "Dairy",
  "pizza": "Frozen",
  "pizza dough": "Bakery",
  "pizza sauce": "Pantry",
  "toilet paper": "Household",
  "paper towels": "Household",
  "toothpaste": "Personal Care",
  "dog food": "Household",
  "baby wipes": "Personal Care",
  "wipes": "Household",
  "diapers": "Personal Care",
  "yogurt": "Dairy",
  "greek yogurt": "Dairy",
  "granola bar": "Snacks",
  "granola": "Pantry",
  "cereal": "Pantry",
  "coffee": "Beverages",
  "coffee creamer": "Dairy",
  "half and half": "Dairy",
  "half & half": "Dairy",
  "mac and cheese": "Pantry",
  "mac & cheese": "Pantry",
  "rotisserie chicken": "Deli",
  "sliced turkey": "Deli",
  "ground beef": "Meat & Seafood",
  "salmon": "Meat & Seafood",
  "shrimp": "Meat & Seafood",
  "broccoli": "Produce",
  "bananas": "Produce",
  "onion rings": "Frozen",
  "onions": "Produce",
  "bell peppers": "Produce",
  "black pepper": "Pantry",
  "pepper": "Produce",
  "laundry detergent": "Household",
  "ice cream sandwich": "Frozen",
  "sandwich": "Deli",
  "hot dog buns": "Bakery",
  "hot dogs": "Meat & Seafood",
  "french fries": "Frozen",
  "sweet potato": "Produce",
  "sweet potato fries": "Frozen",
  "cream cheese": "Dairy",
  "sour cream": "Dairy",
  "whipped cream": "Dairy",
  "coconut milk": "Pantry",
  "coconut water": "Beverages",
  "coconut": "Produce",
  "avocado": "Produce",
  "avocado oil": "Pantry",
  "tomato soup": "Pantry",
  "tomatoes": "Produce",
  "canned tomatoes": "Pantry",
  "spaghetti": "Pantry",
  "pasta sauce": "Pantry",
  "bagels": "Bakery",
  "croissant": "Bakery",
  "hummus": "Deli",
  "tortilla chips": "Snacks",
  "tortillas": "Bakery",
  "flour": "Pantry",
  "sugar": "Pantry",
  "egg rolls": "Frozen",
  "eggplant": "Produce",
  "applesauce": "Pantry",
  "apples": "Produce",
  "pineapple": "Produce",
  "grapefruit": "Produce",
  "grapes": "Produce",
  "water": "Beverages",
  "sparkling water": "Beverages",
  "beer": "Beverages",
  "batteries": "Household",
  "vitamins": "Personal Care",
  "bandages": "Personal Care",
  "pickles": "Pantry",
  "ketchup": "Pantry",
  "mustard": "Pantry",
  "mayo": "Pantry",
  "olives": "Pantry",
  "mushrooms": "Produce",
  "cream of mushroom soup": "Pantry",
  "frozen pizza": "Frozen",
  "deli ham": "Deli",
  "ham": "Meat & Seafood",
  "sliced ham": "Deli",
  "garlic": "Produce",
  "bread crumbs": "Pantry",
  "conditioner": "Personal Care"
};

Object.keys(guesses).forEach(function (name) {
  eq(logic.guessSection(name), guesses[name], name);
});

eq(logic.sectionFor("Milk", {}), "Dairy", "milk with no memory");
eq(logic.sectionFor("Milk", { milk: { sectionChoice: "Pantry" } }), "Pantry", "remembered aisle");
eq(logic.sectionFor("Milk", { milk: { sectionChoice: "Nope" } }), "Dairy", "ignore a bad aisle");

var milk = logic.parseEntry("milk");
eq(milk.name, "Milk", "tidy milk");
eq(milk.qty, 1, "default qty");
var apples = logic.parseEntry("2 apples");
eq(apples.name, "Apples", "leading qty name");
eq(apples.qty, 2, "leading qty");
var eggs = logic.parseEntry("eggs x3");
eq(eggs.name, "Eggs", "trailing qty name");
eq(eggs.qty, 3, "trailing qty");
var percent = logic.parseEntry("2% milk");
eq(percent.name, "2% Milk", "do not treat 2% as a quantity");
eq(percent.qty, 1, "2% milk qty");
var mac = logic.parseEntry("mac & cheese");
eq(mac.name, "Mac & Cheese", "keep an ampersand in the name");
eq(logic.guessSection(mac.name), "Pantry", "ampersand still finds the aisle");
assert(logic.parseEntry("   ") === null, "blank entry");
assert(logic.parseEntry("2x milk").qty === 2, "2x milk qty");
eq(logic.parseEntry("2x milk").name, "Milk", "2x milk name");

var now = Date.UTC(2026, 0, 30);
var day = logic.DAY;
var due = {
  name: "Milk",
  count: 3,
  purchases: [now - 23 * day, now - 16 * day, now - 9 * day],
  dismissedUntil: null
};
var dueInfo = logic.stapleStatus(due, now);
assert(dueInfo, "staple is due");
eq(dueInfo.everyDays, 7, "usual gap");
eq(dueInfo.agoDays, 9, "days since last buy");

var notDue = {
  name: "Milk",
  count: 3,
  purchases: [now - 15 * day, now - 8 * day, now - 1 * day],
  dismissedUntil: null
};
assert(logic.stapleStatus(notDue, now) === null, "not due yet");

var dismissed = Object.assign({}, due, { dismissedUntil: now + day });
assert(logic.stapleStatus(dismissed, now) === null, "dismissed staple stays hidden");
assert(logic.stapleStatus({ name: "Milk", count: 1, purchases: [now - 9 * day] }, now) === null, "one purchase is not a pattern");

var noisy = {
  name: "Eggs",
  count: 4,
  purchases: [now - 21 * day, now - 21 * day + 60 * 60 * 1000, now - 14 * day, now - 7 * day],
  dismissedUntil: null
};
var noisyInfo = logic.stapleStatus(noisy, now);
assert(noisyInfo, "short double-check does not hide a weekly staple");
eq(noisyInfo.everyDays, 7, "median ignores the one-hour gap");

var history = {
  milk: { name: "Milk", count: 4, purchases: [now - 30 * day, now - 20 * day, now - 10 * day], dismissedUntil: null },
  eggs: { name: "Eggs", count: 2, purchases: [now - 2 * day, now - 1 * day], dismissedUntil: null },
  bread: { name: "Bread", count: 1, purchases: [now - 1 * day], dismissedUntil: null }
};
var staples = logic.stapleSuggestions(history, [], now);
eq(staples.length, 1, "only milk is running low");
eq(staples[0].name, "Milk", "staple name");
var frequent = logic.frequentItems(history, [{ name: "Milk" }], now);
eq(frequent.length, 1, "eggs are frequent, milk is on the list, bread was once");
eq(frequent[0].name, "Eggs", "frequent name");

var recorded = logic.recordPurchase(logic.blankEntry("Bananas"), now);
eq(recorded.entry.count, 1, "purchase count");
var undone = logic.undoPurchase(recorded.entry, recorded.token);
eq(undone.count, 0, "uncheck removes the purchase");
eq(undone.purchases.length, 0, "uncheck removes the timestamp");

["v1/index.html", "v1/styles.css", "v1/app.js", "v1/sw.js", "v1/manifest.json", "index.html", "versions/index.html"].forEach(function (file) {
  var text = fs.readFileSync(path.join(root, file), "utf8");
  assert(!/wegmans/i.test(text), file + " stays brand neutral");
  assert(!/(?:href|src|action)\s*=\s*["']\//.test(text), file + " uses relative links");
});

var sw = fs.readFileSync(path.join(root, "v1/sw.js"), "utf8");
assert(sw.indexOf("cart-v1-") !== -1, "service worker cache is named for v1");
assert(!/caches\.delete\([^)]*cart-v2/.test(sw), "v1 does not delete a later version's cache");
var manifest = JSON.parse(fs.readFileSync(path.join(root, "v1/manifest.json"), "utf8"));
eq(manifest.name, "Cart", "manifest name");
eq(manifest.short_name, "Cart", "manifest short name");
eq(manifest.start_url, "./", "manifest start url is relative");
eq(manifest.scope, "./", "manifest scope stays inside this version");
["v1/icons/icon.svg", "v1/icons/icon-192.png", "v1/icons/icon-512.png", "v1/icons/icon-maskable-512.png", "v1/icons/apple-touch-icon.png"].forEach(function (file) {
  assert(fs.existsSync(path.join(root, file)), file + " exists");
});

if (failed) {
  console.error(failed + " failed");
  process.exit(1);
}
console.log("self-check ok");
