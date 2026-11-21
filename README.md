# Cart

A grocery list for your phone. It sorts items by aisle, remembers what you buy often, and nudges you when a staple is probably running low. Everything stays in the phone's browser. There is no account and no internet is required after the first visit.

The name of the app is **Cart**.

## Open it

After this is published, the address is:

<https://toddesing-afk.github.io/grocery-list/>

That opens the latest version. Version 1 itself lives at:

<https://toddesing-afk.github.io/grocery-list/v1/>

Older versions stay up. The full list is at:

<https://toddesing-afk.github.io/grocery-list/versions/>

On a phone, open that page in the browser, then add it to the home screen (Share, then Add to Home Screen on an iPhone). It opens full screen, like an app. The list is saved on that phone only. Clearing the browser's data for the site deletes the list.

## Try it on this computer

From this folder:

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765/v1/>.

## Version 1

Check items into an "In cart" area, change an item's aisle with a tap (Cart remembers that choice for the same name), see frequent items and a running-low nudge, and switch light or dark mode. The footer says `v1`.

Cart follows the phone's light or dark setting until you tap the sun or moon.

## Teach Cart a new aisle word

Open `v1/dictionary.js`. Each aisle has a list of lowercase words. Add the word to the aisle where you shop for it. The last words of what you type matter most, and a longer phrase wins over a shorter one (`chocolate chip` is the baking aisle, `chip` is snacks).

In `v1/sw.js`, change the cache name (`cart-v1-shell-1` to `cart-v1-shell-2`, and so on) so phones pick up the new file. Merge that into `main`. The site updates on its own.

You can check the aisle rules, if Node is installed:

```bash
node scripts/self-check.js
```

## Publish the next version

Each version is a folder (`v1`, later `v2`) and stays reachable. To add version 2:

1. Copy the `v1` folder to `v2`.
2. In `v2/sw.js`, use a cache name that starts with `cart-v2-`. Leave the worker inside `v2/` so it does not control `v1`.
3. In `v2/app.js`, the list is stored under `cart.v1`. Keep that key if version 2 should open the same list. Use `cart.v2` (and the matching theme key) if it should start fresh. The theme key is `cart.v1.theme`.
4. Change the footer in `v2/index.html` to `v2` and replace the one-line note with what changed.
5. In the root `index.html`, point the links from `v1/` to `v2/`. Search that file for `v1`.
6. On `versions/index.html`, add a line for version 2. Leave the version 1 line in place.
7. Merge into `main`.

The publish workflow copies the home page, the versions page, and every `v1`, `v2`, `v3`… folder. You do not have to edit the workflow to add a version.

GitHub Pages deploys from the workflow in `.github/workflows/pages.yml` when `main` changes. The source is GitHub Actions, not a branch folder.
