---
title: "Filling government PDF forms from code"
date: "2026-11-19"
topics: [programming]
description: "Agency PDFs are fillable, but the field names are meaningless and the file you downloaded might be next year's form. Three fixes."
draft: false
---

I had a stack of US tax forms to fill in by hand this month. Paper filing, a
dozen forms, every number flowing from one sheet to the next. The kind of job
where you type it all in, find one mistake, and get to proofread 300 boxes
again.

So I automated it. The forms are real PDFs with real form fields, so this
should have been an afternoon. It mostly was — but three things bit, and two of
them would have silently produced a wrong document.

## The fields have no names

Government PDFs are AcroForm documents, which is good news: the widgets are
there, you can set values, and the result prints correctly. Form 8621 has 173
of them.

Here's the problem:

```
topmostSubform[0].Page1[0].NameAddress[0].f1_1[0]
topmostSubform[0].Page1[0].f1_16[0]
```

That's the field name. And every `/TU` tooltip — the thing that would tell you
`f1_16` is "Name of foreign corporation" — is empty. On every field. On every
form I looked at.

You can't guess from the numbering either, because it restarts per page and
skips.

### The fix: make the form label itself

Fill every text widget with its own index, render the result, and look at it.

```python
import pymupdf

doc = pymupdf.open("f8621.pdf")
idx = 0
for page in doc:
    for w in page.widgets():
        if w.field_type_string == "Text":
            idx += 1
            w.field_value = str(idx)
            w.text_fontsize = 6
            w.update()
doc.save("calibration.pdf")
```

Render that at 150 dpi and every number sits in the box it belongs to. One
look gives you the whole page:

```
1  Name of shareholder     13  Identifying number
2  Street                  14  PFIC name
6  Country                 17  Reference ID
7  ZIP                     27  line 5a amount
```

Write that into a JSON map once, and from then on you're filling
`{"pfic_name": "..."}` instead of `f1_16[0]`.

It's self-verifying, too. If a number lands in the wrong box, your map is
wrong and you can see it. Took about two minutes per form, and it works on any
agency PDF, not just tax ones.

Related, and the same lesson from the other direction: don't try to read these
with `pdftotext`. The text layer hides the structure. Render to images.

## Repeating a page doesn't work the way you'd expect

Form 8621 says, in bold: _complete a separate Part V for each disposition_. So
if you sold a fund five times, you need five copies of page 3.

The obvious move is to copy the page five times and fill each copy. This fails,
and it fails quietly: in AcroForm, **a field name is global to the document.**
Duplicate the page and you have five widgets called `f3_12[0]`. Set one, and
all five show the same value.

You can rename every widget on every copy. Or you can stop treating them as
fields:

```python
main = pymupdf.open(SRC)
fill(main, page1_values)
main.bake(widgets=True)          # widgets become page content

pages = []
for d in dispositions:
    t = pymupdf.open(SRC)
    fill(t, part_v_values(d))
    t.bake(widgets=True)
    pages.append(t)

out = pymupdf.open()
out.insert_pdf(main, from_page=0, to_page=1)
for t in pages:
    out.insert_pdf(t, from_page=2, to_page=2)
out.insert_pdf(main, from_page=3, to_page=3)
```

`bake()` converts the widgets into static page content, so the values stop
being fields and become drawing. No name collisions, because there are no
names any more.

Check it with `sum(len(list(p.widgets())) for p in doc) == 0`. Zero residual
widgets means nothing can shift later.

Bonus: baking _is_ flattening. If you needed repeated pages, you were going to
flatten anyway.

## The one that nearly got me

Here's the thing about `irs.gov/pub/irs-pdf/<form>.pdf`: it serves whatever the
agency most recently posted. Not the form for the year you're filing. The form
they've most recently finalized.

In November, filling a return for the _previous_ tax year, `f1040s8.pdf`
returned Schedule 8812 **for the following year** — created in August, already
live. Every other form in the set was still the right year. They roll forms
forward individually as each one is finalized, which means one form in a set
can be a year ahead of the others, and nothing about the filename says so.

Prior years live at a different path, with a double hyphen:

```
https://www.irs.gov/pub/irs-prior/f1040s8--2025.pdf
```

And it mattered. I diffed the calibration maps of the two years: every widget
rectangle had moved. The map built from the wrong year would have put numbers
in the wrong boxes on a form I was going to sign.

The field _count_ was identical between the two years. So a sanity check on
field count — which is the check you'd naturally write — catches nothing.

The only thing that catches it is reading the year off the page:

```python
print(" ".join(doc[0].get_text().split()[:12]))
# SCHEDULE 8812 (Form 1040) 2025 Credits for Qualifying Children ...
```

One line, every form, every time. Not the filename. Not the field count.

## Smaller things, in case they save you an hour

**Text widgets and button widgets are separate index spaces.** Of 173 fields on
one form, 127 were text. Count them separately or your map drifts by 46.

**Checkbox "on" values aren't `Yes`.** They're per-widget, and on the forms I
hit they were `'1'`, `'2'`, `'3'`… Read it from
`w.button_states()["normal"][0]` instead of hardcoding. Radio groups share a
field name with different on-states, so setting one widget selects that option.

**Assert that the form has fields.** Get the filename slightly wrong and you
download the _instructions_ PDF — a perfectly valid PDF with zero form fields,
which fails completely silently. `assert text_widget_count > 0` would have
saved me a confused minute. The giveaway was "0 text widgets, 10 pages."

**Unicode is fine.** I expected `å`, `ä`, `ö` to break the field appearance
streams. They round-trip and render correctly, em dashes included. Nice when
the gotcha you planned for doesn't show up.

**Fail loudly on unknown keys.** My fill driver exits if the values file
contains a key the map doesn't know. A typo would otherwise produce a form with
one line silently missing, which is not something you catch by skimming a PDF.

## Why bother

Not the typing. The typing is maybe an hour.

It's that the document becomes **reproducible and diffable**. The map is
reviewed once. The values live in a small JSON file you can read in one screen.
Change an input, regenerate, and the change is a diff rather than a hunt
through 300 boxes.

Which matters most when you'll have to do it again — an amendment, a correction,
next year's version with the rectangles moved two points to the left.

Tooling, for the record: [PyMuPDF](https://pymupdf.readthedocs.io/), which does
both the filling and the rendering, so the whole verify loop stays in one
library. `pypdf` reads fields fine if you just want a quick `get_fields()` dump.
