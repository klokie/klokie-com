---
title: "Keeping HTML-to-PDF text editable"
date: "2026-08-19"
topics: [programming, design]
description: "Chrome's print-to-PDF can produce a visually perfect file with outlined text, fragile masks, or an unreadable QR code. Four quiet failure modes from making a print flyer."
draft: false
---

I needed a printable A4 flyer, but I also wanted the text to remain text in the
PDF — so I could make small edits in Illustrator without going back to the
source. HTML and headless Chrome seemed like a good fit: CSS understands
millimeters and `@page`, the layout stays in version control, and the PDF is
easy to regenerate.

It worked. It also produced several files that looked completely correct while
being wrong in ways that only appeared downstream:

- a variable font was emitted as Type 3 outlines rather than editable text;
- a soft mask developed a hard edge in iOS PDF viewers;
- a QR code looked fine but was not reliably scannable after export; and
- a simple brightness threshold removed part of a cream-colored logo.

The useful general lesson is this: **a PDF is not validated by looking at it.**
Validate the properties you care about — font types, compositing, machine
readability — from the generated file.

## The pipeline

This was the minimal export command:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=out.pdf --virtual-time-budget=9000 \
  "file:///path/to/flyer.html"
```

With `@page { size: A4; margin: 0 }` and a page element sized in `mm`, Chrome
produced the expected page size. The important work started after that command:
checking what was actually inside `out.pdf`.

## 1. Variable fonts can become Type 3 fonts

The first check was:

```bash
pdffonts out.pdf
```

The result looked like this:

```
name                              type              emb sub uni
--------------------------------- ----------------- --- --- ---
AAAAAA+InstrumentSerif-Regular    CID TrueType      yes yes yes
BAAAAA+DMSans-9ptRegular_opszAF5E3_wght1F40000  Type 3  yes yes yes
```

The headline font was an embedded TrueType font. The body font was Type 3.

A Type 3 font stores glyphs as PDF drawing procedures. It can render perfectly,
but many PDF and vector editors will expose those glyphs as outlines rather
than usable text. That defeats the purpose of keeping the PDF editable.

In this case the difference was a variable font. Chrome instantiated its axes
at render time and emitted the result as Type 3; the axis values were even
visible in the generated font name (`opsz...wght...`). This is a behavior to
test in your exact Chrome/font combination, not a claim that every variable
font always becomes Type 3.

The obvious fix — asking Google Fonts for a “static” stylesheet — did not fix
this particular font. The files served by

```text
https://fonts.googleapis.com/css?family=DM+Sans:400,500,700
```

were still derived from the variable family, and Chrome still produced Type 3.

What worked was creating static instances with
[fontTools](https://github.com/fonttools/fonttools):

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

for name, weight in [("regular", 400), ("medium", 500), ("bold", 700)]:
    font = TTFont("DMSans[opsz,wght].ttf")
    instancer.instantiateVariableFont(
        font,
        {"wght": weight, "opsz": 14},
        inplace=True,
    )
    font.flavor = "woff2"
    font.save(f"DMSans-{name}.woff2")
```

Declare those files in separate `@font-face` rules with explicit weights,
export again, and check the result with `pdffonts`. In my output they became
CID TrueType fonts and remained text that Illustrator could work with.

Two caveats matter here:

1. “Embedded font” does not guarantee that every editor will preserve every
   text feature. Test the actual editor and PDF workflow you intend to use.
2. `pdffonts` is a quick, useful signal, not a complete editability test. Open a
   representative PDF in the downstream application before committing to a
   font stack.

The PDF can look identical either way. Inspect the font table, then test the
real editing workflow.

## 2. Soft masks are renderer-dependent

The flyer used a soft-focus effect: one copy of an image stayed sharp while the
rest was blurred, with a feathered transition between them. In CSS, that meant
two image layers and a radial-gradient mask:

```css
.sharp {
  mask-image: radial-gradient(
    ellipse 54% 27% at 50% 53%,
    #000 42%,
    rgba(0, 0, 0, 0.32) 84%,
    transparent 100%
  );
}
```

It looked beautiful in Chrome, Preview, and Acrobat. On iOS, the same exported
PDF showed a hard seam where the gradient should have been smooth.

The issue was not malformed CSS. Chrome had translated the gradient into a PDF
soft mask (`SMask`), and the viewers did not render that mask identically. A
PDF feature that is perfectly acceptable for screen output can still be a poor
choice when the file must work across several renderers.

The robust fix was to do the compositing before PDF generation: blur the image,
apply the feathered mask in pixels, and give Chrome one flattened image. Use a
lossless PNG when the artwork has sharp edges or transparency; use JPEG only
when its compression artifacts are acceptable.

```python
import numpy as np
from PIL import Image, ImageFilter

sharp = Image.open("photo.png").convert("RGB")
W, H = sharp.size
blurred = sharp.filter(ImageFilter.GaussianBlur(radius=41))

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
mask = np.interp(
    d,
    [0.42, 0.66, 0.84, 1.0],
    [1.0, 0.72, 0.32, 0.0],
).astype(np.float32)[..., None]

out = (
    np.asarray(sharp, np.float32) * mask
    + np.asarray(blurred, np.float32) * (1 - mask)
).clip(0, 255).astype(np.uint8)
Image.fromarray(out).save("photo-composited.png")
```

This reduced my PDF from 7.9 MB to 1.9 MB because Chrome had been flattening
the layers to a full-page raster anyway — just less efficiently, and twice.

As a quick diagnostic, this can reveal whether a PDF contains soft masks:

```bash
strings out.pdf | grep -c SMask
```

Treat that as a clue, not a formal PDF inspection tool. An `SMask` count does
not tell you whether a mask is a gradient, an image alpha channel, or whether
it will fail in a particular viewer. The definitive check is to open the PDF in
the viewers and devices you support, or flatten the effect when portability is
more important than editability.

## 3. Keep the QR code vector, then decode the PDF

The flyer also needed a QR code. Two details made a difference.

First, keep the code vector. In this Chrome pipeline, an SVG referenced as an
`<img>` was rasterized during printing, while the same SVG inlined directly in
the HTML stayed vector. That may vary with the browser and SVG, so inspect the
output if it matters. For a QR code, vector modules are preferable: soft raster
edges make scanning harder, especially when the code is printed small.

Second, verify the code from the rendered PDF, not from the source HTML. The
export pipeline can change scale, clipping, contrast, or compositing after the
source has already passed its own tests.

For complete control, I generated rectangular runs from the QR module matrix
instead of using the library's single stroked path:

```python
import segno

qr = segno.make("https://example.com", error="h")
rects = []
for y, row in enumerate(qr.matrix):
    x = 0
    while x < len(row):
        if row[x]:
            start = x
            while x < len(row) and row[x]:
                x += 1
            rects.append(
                f'<rect x="{start + 2}" y="{y + 2}" '
                f'width="{x - start}" height="1"/>'
            )
        else:
            x += 1
```

The `+2` values provide a two-module quiet zone in this example; the SVG's
`viewBox` and scaling need to account for it. Error correction level `H` can
recover roughly 30% damage, but it is not a substitute for sufficient physical
size, contrast, and a proper quiet zone.

After exporting, rasterize the page, crop the code, and decode that crop:

```python
import cv2

value, points, _ = cv2.QRCodeDetector().detectAndDecode(page_crop)
if not value:
    raise RuntimeError("QR code did not decode from the rendered PDF")
```

That test covers the artifact you will actually distribute, not merely the
input you intended to distribute.

## 4. Remove a white background by connectivity

The logo was dark-on-white artwork, but some lettering was cream. A brightness
threshold therefore removed parts of the logo along with the background.

When the background is contiguous with the image edges, a flood fill is a
better model: remove pixels connected to the outside, rather than pixels that
happen to be bright. In production I used a flood-filled mask and converted
the filled region to transparency:

```python
import numpy as np
from PIL import Image, ImageDraw

image = Image.open("logo.png").convert("RGBA")
background = Image.new("L", image.size, 0)

for seed in [(0, 0), (image.width - 1, 0),
             (0, image.height - 1), (image.width - 1, image.height - 1)]:
    ImageDraw.floodfill(background, seed, 255, thresh=28)

alpha = image.getchannel("A")
alpha = Image.fromarray(
    np.minimum(np.asarray(alpha), 255 - np.asarray(background)).astype("uint8")
)
image.putalpha(alpha)
image.save("logo-transparent.png")
```

This preserves cream lettering and enclosed counters because they are not
connected to the outside. Choose the flood-fill threshold carefully: anti-
aliased edges need some tolerance, but too much tolerance can leak into the
artwork.

## A small preflight checklist

For a PDF that needs to survive editing, printing, and mobile viewing, my
minimum preflight now looks like this:

```bash
pdffonts out.pdf                 # inspect embedded font types
pdfinfo out.pdf                  # confirm page size and page count
pdftoppm -png -r 150 out.pdf page # make a test raster
strings out.pdf | grep -c SMask  # flag soft-mask use for investigation
```

Then I decode every QR code from the rasterized page and open the PDF in at
least one desktop editor and one mobile viewer. If a visual effect is not worth
that compatibility test, I flatten it before export.

## Was it worth it?

Yes — but the reusable result is not a particular Chrome flag or font trick.
It is the discipline of validating the generated artifact.

Type 3 fonts render perfectly. A soft mask can look fine on the machine that
made it. A broken QR code still looks like a QR code. None of those failures
necessarily appears when you open the PDF and squint at it.

The checks are cheap: `pdffonts` for fonts, `pdfinfo` for dimensions, a
rasterized-page decode for QR codes, and a deliberate viewer test for effects
that depend on PDF compositing. That small preflight is what turned this from a
fragile one-off flyer into a reproducible HTML-to-PDF workflow.
