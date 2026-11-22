/* Cart aisle words.
   To teach Cart a new item, add the lowercase word to the aisle where you
   shop for it. The last words of what you type matter most, and a longer
   phrase beats a shorter one: "chocolate chip" is the baking aisle, "chip" is snacks.
   Then bump the cache name in sw.js so phones pick up the change. */
(function () {
  var SECTION_KEYWORDS = {
    "Produce": [
      "apple", "apricot", "artichoke", "arugula", "asparagus", "avocado",
      "banana", "basil", "beet", "bell pepper", "berry", "blackberry",
      "blueberry", "bok choy", "broccoli", "brussels sprout", "butternut",
      "cabbage", "cantaloupe", "carrot", "cauliflower", "celery", "chard",
      "cherry", "cilantro", "clementine", "coconut", "collard", "corn", "cranberry",
      "cucumber", "dill", "eggplant", "endive", "fennel", "fig", "fruit",
      "garlic", "ginger", "grape", "grapefruit", "green bean", "green onion",
      "herb", "honeydew", "jalapeno", "kale", "kiwi", "leek", "lemon",
      "lettuce", "lime", "mango", "mint", "mushroom", "nectarine", "okra",
      "onion", "orange", "papaya", "parsley", "peach", "pear", "pea", "pepper",
      "pineapple", "plantain", "plum", "pomegranate", "potato", "pumpkin",
      "radish", "raspberry", "romaine", "rosemary", "salad", "salad kit",
      "salad mix", "scallion", "shallot", "snap pea", "snow pea", "spinach",
      "spring mix", "sprout", "squash", "strawberry", "sweet potato",
      "tangerine", "thyme", "tomatillo", "tomato", "turnip", "vegetable",
      "watermelon", "yam", "zucchini", "butter lettuce", "mixed greens",
      "cherry tomato", "corn on the cob"
    ],
    "Bakery": [
      "bagel", "baguette", "bakery", "biscuit", "bread", "brioche", "bun",
      "challah", "ciabatta", "cornbread", "croissant", "crouton", "cupcake",
      "donut", "doughnut", "english muffin", "focaccia", "garlic bread",
      "hamburger bun", "hot dog bun", "loaf", "muffin", "naan", "pastry",
      "pie", "pita", "roll", "rye", "scone", "sourdough", "tortilla",
      "pizza dough", "sandwich bread", "hamburger buns", "hot dog buns"
    ],
    "Deli": [
      "bologna", "chicken salad", "cold cut", "coleslaw", "deli",
      "egg salad", "guacamole", "hummus", "lunch meat", "macaroni salad",
      "olive bar", "pastrami", "pasta salad", "pepperoni", "potato salad",
      "prosciutto", "rotisserie", "rotisserie chicken", "salami", "sandwich",
      "sliced chicken", "sliced ham", "sliced roast beef", "sliced turkey",
      "smoked salmon", "sushi", "tuna salad"
    ],
    "Meat & Seafood": [
      "anchovy", "bacon", "beef", "bratwurst", "brisket", "chicken",
      "chicken breast", "chicken thigh", "chicken wing", "chorizo", "clam",
      "cod", "crab", "drumstick", "fish", "flank steak", "ground beef",
      "ground chicken", "ground pork", "ground turkey", "halibut", "ham",
      "hamburger", "hot dog", "kielbasa", "lamb", "lobster", "meatball",
      "mussel", "oyster", "pancetta", "pork", "pork chop", "prawn", "ribeye",
      "ribs", "roast", "salami stick", "salmon", "sausage", "scallop",
      "seafood", "shrimp", "sirloin", "steak", "tilapia", "trout", "tuna steak",
      "turkey", "veal", "ahi tuna", "fresh tuna", "pork loin", "short rib"
    ],
    "Dairy": [
      "butter", "buttermilk", "cheddar", "cheese", "chocolate milk",
      "coffee creamer", "cottage cheese", "cream", "cream cheese", "creamer",
      "egg", "eggnog", "feta", "goat cheese", "greek yogurt", "half and half",
      "heavy cream", "kefir", "margarine", "milk", "mozzarella", "parmesan",
      "provolone", "pudding", "ricotta", "shredded cheese", "sour cream",
      "string cheese", "swiss", "whipped cream", "whipping cream", "yogurt",
      "yoghurt", "pepper jack", "american cheese", "lactose free milk"
    ],
    "Frozen": [
      "dumpling", "edamame", "egg roll", "fish stick", "french fry",
      "frozen", "fry", "gelato", "hash brown", "ice", "ice cream",
      "ice cream sandwich", "lasagna", "mozzarella stick", "nugget",
      "onion ring", "pizza", "popsicle", "pot pie", "pot sticker", "sorbet",
      "spring roll", "tater tot", "taquito", "toaster pastry", "tv dinner",
      "waffle", "whipped topping", "frozen meal", "frozen dinner",
      "frozen pizza", "chicken nugget", "cookie dough", "sweet potato fry"
    ],
    "Pantry": [
      "almond butter", "apple cider vinegar", "applesauce", "apple sauce",
      "baking powder", "baking soda", "barbecue sauce", "bean", "black bean",
      "black pepper", "bread crumb", "breadcrumb", "broth", "brown sugar",
      "canned", "cereal", "chickpea", "chili", "chocolate chip", "cocoa",
      "coconut milk", "coconut oil", "cornstarch", "corn starch", "couscous",
      "cracker crumb", "cream of chicken", "cream of mushroom", "dressing",
      "evaporated milk", "flour", "granola", "gravy", "honey", "hot sauce",
      "jam", "jelly", "ketchup", "lentil", "mac and cheese",
      "macaroni and cheese", "maple syrup", "marinara", "mayo", "mayonnaise",
      "mustard", "noodle", "oat", "oatmeal", "oil", "olive", "olive oil",
      "pancake mix", "panko", "pasta", "pasta sauce", "peanut butter",
      "peppercorn", "pickle", "quinoa", "ramen", "rice", "relish", "salsa",
      "salt", "sauce", "seasoning", "soup", "soy sauce", "spaghetti", "spice",
      "stock", "stuffing", "sugar", "syrup", "taco seasoning", "taco shell",
      "tomato paste", "tomato sauce", "tuna", "vanilla", "vegetable oil",
      "vinegar", "yeast", "canned tuna", "tuna pouch", "cake mix",
      "brownie mix", "cookie mix", "salad dressing", "chicken broth",
      "beef broth", "vegetable broth", "chicken stock", "diced tomato",
      "peanut oil", "avocado oil", "sesame oil", "canola oil", "bbq sauce",
      "pizza sauce", "cheese sauce"
    ],
    "Snacks": [
      "almond", "candy", "cashew", "chip", "chocolate", "chocolate bar",
      "cookie", "cracker", "energy bar", "fruit snack", "granola bar",
      "gummy", "jerky", "milk chocolate", "mixed nut", "nut", "peanut",
      "peanut butter cup", "pistachio", "popcorn", "pretzel", "protein bar",
      "raisin", "rice cake", "saltine", "sunflower seed", "tortilla chip",
      "trail mix", "walnut", "pecan", "pumpkin seed", "potato chip",
      "pita chip", "candy bar", "dried fruit", "beef jerky"
    ],
    "Beverages": [
      "almond milk", "apple cider", "apple juice", "beer", "coffee",
      "cola", "cranberry juice", "energy drink", "grape juice", "ginger ale",
      "hot chocolate", "iced tea", "juice", "kombucha", "lemonade",
      "oat milk", "orange juice", "pop", "rice milk", "seltzer", "soda",
      "soy milk", "sparkling water", "sports drink", "tea", "water", "wine",
      "coconut water", "cashew milk", "bottled water", "cold brew",
      "electrolyte drink", "soft drink"
    ],
    "Household": [
      "aluminum foil", "battery", "bleach", "cat food", "cat litter",
      "cleaner", "coffee filter", "detergent", "dish soap", "dishwasher pod",
      "dog food", "dog treat", "dryer sheet", "fabric softener", "foil",
      "garbage bag", "glass cleaner", "laundry detergent", "light bulb",
      "napkin", "paper plate", "paper towel", "parchment paper", "pet food",
      "plastic wrap", "sponge", "storage bag", "tissue", "toilet paper",
      "trash bag", "wipe", "sandwich bag", "freezer bag", "cat treat",
      "air freshener", "dish pod", "laundry soap"
    ],
    "Personal Care": [
      "bandage", "body wash", "conditioner", "deodorant", "diaper", "floss",
      "hand soap", "ibuprofen", "lip balm", "lotion", "mouthwash",
      "pain reliever", "razor", "shampoo", "shaving cream", "soap",
      "sunscreen", "tampon", "toothbrush", "toothpaste", "vitamin",
      "baby wipe", "cotton swab", "face wash", "moisturizer", "cough drop",
      "multivitamin", "dental floss"
    ]
  };

  globalThis.SECTION_KEYWORDS = SECTION_KEYWORDS;
})();
