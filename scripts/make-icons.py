"""Draw the Cart icon: a shopping cart and a leaf. Run from the repo root."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "v1" / "icons"
GREEN = (30, 77, 60, 255)
CREAM = (247, 244, 236, 255)
LEAF = (183, 228, 199, 255)


def draw(size):
    image = Image.new("RGBA", (size, size), GREEN)
    draw = ImageDraw.Draw(image)
    scale = size / 512

    def xy(x, y):
        return (x * scale, y * scale)

    def polygon(points, fill):
        draw.polygon([xy(x, y) for x, y in points], fill=fill)

    def disc(cx, cy, radius, fill):
        x, y = xy(cx, cy)
        r = radius * scale
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)

    polygon([(158, 214), (372, 214), (338, 352), (196, 352)], CREAM)
    width = max(2, int(22 * scale))
    box = xy(176, 118) + xy(354, 292)
    draw.arc(box, start=200, end=340, fill=CREAM, width=width)
    disc(214, 394, 26, CREAM)
    disc(324, 394, 26, CREAM)
    disc(214, 394, 10, GREEN)
    disc(324, 394, 10, GREEN)

    leaf = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    leaf_draw = ImageDraw.Draw(leaf)
    box = xy(308, 124) + xy(424, 208)
    leaf_draw.ellipse(box, fill=LEAF)
    leaf = leaf.rotate(32, resample=Image.Resampling.BICUBIC, center=xy(366, 166))
    image.alpha_composite(leaf)

    vein = ImageDraw.Draw(image)
    vein.line([xy(332, 176), xy(392, 150)], fill=GREEN, width=max(2, int(5 * scale)))
    return image.convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    draw(192).save(OUT / "icon-192.png", optimize=True)
    draw(512).save(OUT / "icon-512.png", optimize=True)
    draw(512).save(OUT / "icon-maskable-512.png", optimize=True)
    draw(180).save(OUT / "apple-touch-icon.png", optimize=True)
    print("wrote icons")


if __name__ == "__main__":
    main()
