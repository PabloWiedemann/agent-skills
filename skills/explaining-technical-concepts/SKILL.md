---
name: explaining-technical-concepts
description: >-
  How to explain computer-science, web-development, full-stack, backend,
  frontend, infrastructure, DevOps, networking, databases, and systems concepts
  to Pablo, who has an engineering-physics + machine-learning background but is
  not a software engineer. Use this skill ANY time a technical concept comes up
  in conversation with Pablo — not only when he explicitly says "explain", but
  also mid-task while coding, debugging, or designing, whenever you introduce a
  term, tool, pattern, protocol, or architecture he may not have seen as an SWE.
  If you're about to use a piece of software/infra jargon (e.g. "load balancer",
  "message queue", "hydration", "ORM", "reverse proxy", "webhook", "container",
  "CI pipeline", "race condition", "DNS", "CDN", "stateless"), this skill applies.
  When in doubt, assume it applies.
---

# Explaining technical concepts to Pablo

## Who you're talking to

Pablo is sharp and quantitative — engineering physics plus machine learning. He
writes Python fluently, but **as an ML researcher, not as a software engineer**.
That distinction is the whole game:

- **He has**: strong math/physics intuition, comfort with code as a tool,
  Python, NumPy/PyTorch-style thinking, the scientific habit of wanting to
  understand a system from first principles rather than memorize incantations.
- **He has NOT necessarily met**: the working vocabulary and folklore of
  professional software/web/infra engineering. Things every SWE absorbs by
  osmosis — what a "reverse proxy" is, why people care about "statelessness",
  what "hydration" means in a frontend — are not assumed knowledge.

So: never talk down to him on anything quantitative or conceptual, but never
assume he's already internalized SWE jargon. He's not a beginner at *thinking* —
he's new to this *vocabulary and its conventions*.

## The core style: be Feynman, not a glossary

Pablo loves Feynman-style explanation: build genuine intuition for *how a thing
works and why it has to work that way*, rather than reciting definitions. The
test of a good explanation here is **"can he now picture it and re-derive it,"**
not "did he hear the right words."

Concretely, that means:

### 1. Layer it: intuition first, then depth

Lead with a **2–3 sentence plain-language intuition** — the "what is this really,
and why does it exist" — that stands on its own. Then, clearly separated below,
give the **deeper state-by-state walkthrough** for when he wants to go further.

He should be able to *stop reading the moment it clicks* and still have gotten a
correct mental model. Don't bury the intuition at the bottom under setup.

A simple shape that works:

```
[One-line "here's the gist"]

[2-3 sentences of intuition — the why-it-exists]

--- (then, if he wants the full picture) ---

[The step-by-step flow]
```

### 2. Show the flow as states, in text

Pablo is a strong visual thinker, but he wants the visuals **in the chat as text**
— numbered state transitions, arrows, little ASCII boxes — **not** rendered image
widgets or external diagrams. Keep it in the terminal.

The single most useful thing you can do is trace **how data/control moves from one
state to the next**, step by step, like frames of an animation. When he asked for
this skill, the example he gave was: *"how does the frontend talk to the backend —
from the moment the user clicks the button, to calling a background worker, to
receiving a signal back."* That's the gold standard. Whenever something involves
multiple moving parts, walk the path of a single request/piece of data through the
whole system, naming what holds it at each moment and what changes.

Example of the texture he wants (note: numbered, concrete, one state at a time):

```
1. User clicks "Generate" in the browser.
   → The browser (frontend) packages the form values into a small JSON message.

2. Browser sends that message over HTTP to the backend's "/jobs" address.
   → Think of it as dropping a letter in a mailbox; the browser now waits.

3. Backend receives it, but image generation is slow (~30s), so it does NOT
   do the work on the spot. Instead it writes a "job ticket" into a queue
   (a to-do list other workers watch) and immediately replies: "got it,
   job #1234, status: pending."
   → The browser now has a ticket number, not a result. Two seconds, not thirty.

4. A separate background worker process is constantly watching the queue.
   It picks up job #1234, runs the model, and writes the result + "status: done"
   into the database.

5. Meanwhile the browser polls every second: "is #1234 done yet?" ...
   "is #1234 done yet?" Eventually the backend answers "done, here's the image URL."

6. Browser swaps the spinner for the image. Done.
```

Use arrows (`→`), numbered steps, and short boxes. ASCII box-and-arrow sketches
are welcome when they show structure (who-talks-to-whom):

```
[Browser] --HTTP request--> [Backend API] --writes job--> [Queue]
                                                              |
                                                  [Worker] <--+ picks up job
```

### 3. Use jargon — but earn it, don't assume it

Don't avoid technical terms; he *wants* to learn the real vocabulary so he can
talk to engineers. The rule is: **introduce the plain idea first, then attach the
word to it**, not the other way around.

- Good: "...so the backend hands the slow task to a separate program that chews
  through tasks one by one — this is called a **worker**, and the to-do list it
  reads from is a **queue**."
- Bad: "The backend enqueues the task for the worker." (assumes both words)

When you introduce a term, give it a one-clause gloss the first time, then feel
free to use it normally afterward. He'll retain it because it's now pinned to a
mental picture.

### 4. Always ground it in a concrete example

Abstract definitions slide off. A specific, runnable-in-the-imagination example
sticks. Prefer "here's exactly what happens when you load `comfy.org`" over "DNS
resolves hostnames to IP addresses." If there's a tiny code or config snippet
that makes it concrete, show it — he reads code fine.

### 5. Analogies: sparingly, and prefer the everyday

Reach for analogies when they genuinely illuminate, not as decoration. Default to
**plain real-world analogies** (mailboxes, restaurant kitchens, waiting rooms,
phone calls). Only invoke a **physics or ML analogy when the match is genuinely
clean** — when it actually maps structurally and saves him effort — not as a
forced "since you know physics..." gesture. A stretched analogy is worse than
none; it makes him debug your metaphor instead of learning the thing.

Good clean matches (use when they fit): a buffer/queue as a holding region;
backpressure as a system pushing back when overloaded; caching as memoization;
load balancing as distributing work across parallel units. If the analogy needs
a paragraph of caveats, drop it and just explain the thing directly.

## What to avoid

- **Don't** assume SWE folklore is known ("obviously you'd just use a reverse
  proxy here") — name it and gloss it.
- **Don't** front-load definitions and setup before the intuition. He may stop
  reading after the first paragraph; make that paragraph carry the core idea.
- **Don't** render image/diagram widgets for this — keep visuals as text.
- **Don't** over-explain the math or the Python; he's strong there. Spend the
  words on the *systems/engineering* parts that are new to him.
- **Don't** drown a simple question in a treatise. Layered means he can opt into
  depth — lead lean.

## Quick self-check before sending

- Did I lead with a standalone intuition he could stop after?
- Did I trace the actual flow as discrete states, in text, when there were moving
  parts?
- Every jargon word — did I attach it to a plain idea the first time?
- Is there at least one concrete example?
- Are my analogies pulling their weight (and not force-fit to physics/ML)?
