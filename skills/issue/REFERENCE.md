# /issue — Reference

Quick reference. The full template, philosophy, and process live in `SKILL.md`. Read that first.

## Body template recap

See `SKILL.md` for the canonical version. Section order is fixed:

```
Header (Owner · Appetite · Status · Part of)
## Problem
## Outcome
## Solution sketch    (ASCII diagram + code contract)
## Files              (Create / Modify)
## Acceptance criteria
## Rabbit holes
## No-gos
## References
## Depends on         (or Children, on epics)
```

## Heredoc invocation pattern

Always use a temp file rather than inlining the body.

```bash
BODY_FILE="$(mktemp -t issue-body-XXXXXX.md)"
cat > "$BODY_FILE" <<'EOF'
**Owner:** @example
**Appetite:** 1.5 weeks
**Status:** Ready
**Part of:** #100

## Problem

…

## Outcome

- …

## Solution sketch

```
┌─────────┐  ─>  ┌──────────┐
│ Input   │      │ Process  │
└─────────┘      └──────────┘
```

```ts
export type Foo = …
```

(rest of body)
EOF

gh issue create --title "<title>" --body-file "$BODY_FILE"
rm "$BODY_FILE"
```

## Title rules

- Imperative mood: "Extract rate limiter into port", not "Rate limiter extraction".
- Under 70 characters.
- No issue number prefix, no trailing period.
- No emoji.
- Plain language. No internal jargon.

## ASCII diagram tips

Use ASCII, never mermaid. See `../_shared/ascii-diagrams.md` for the character palette and pattern catalog.

- Pick one weight per role (Standard `─│`, Heavy `━┃`, Double `═║`, Rounded `╭╮`).
- Keep diagrams under 80 chars wide.
- One module/flow diagram per issue is usually enough. Add a state diagram only when the thing has lifecycle.
- Wrap the diagram in a fenced ``` ``` block so whitespace survives.
- Label connections (`HTTP`, `tool call`, `peer DM`) when intent isn't obvious from the boxes.

## Common diagram shapes

```
Module flow:
┌─────────┐  ─>  ┌──────────┐  ─>  ┌──────────┐
│ Browser │      │  /api/x  │      │ Backend  │
└─────────┘      └──────────┘      └──────────┘

State machine:
 ┌─────────┐ start  ┌────────┐ finish ┌──────┐
 │ Pending │ ─────> │ Active │ ─────> │ Done │
 └─────────┘        └────────┘        └──────┘

Sequence:
Client  ─ POST ─>  Route  ───>  Worker
                     │            │
                     │ <───────── │  ack
   <── 200 OK ────── │            │
```

## Epic-only

Add `--label epic` on creation. Replace `Depends on` with `Children` containing the child issue numbers as a checkbox list:

```markdown
## Children

- [ ] #N — child issue (appetite)
- [ ] #N — child issue (appetite · depends on #X)
```
