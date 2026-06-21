# ASCII Diagrams

Shared reference for every skill that draws a diagram. Use this instead of mermaid.

## Why ASCII, not mermaid

- Renders everywhere: GitHub, terminals, plain markdown, agent context, copy-paste.
- Information-dense: no rendering pass, no theme drift, no broken-image state.
- Source-of-truth in the same medium as the surrounding prose.
- Tufte rule applied: encode information into structure, not decoration. Subtract anything that isn't carrying meaning.

## Character palette

```
Standard:  ┌─┐ │ └─┘  ├─┤ ┬ ┴ ┼
Heavy:     ┏━┓ ┃ ┗━┛  ┣━┫ ┳ ┻ ╋
Double:    ╔═╗ ║ ╚═╝  ╠═╣ ╦ ╩ ╬
Rounded:   ╭─╮ │ ╰─╯
Arrows:    → ← ↑ ↓ ─> <─ ──> <── ▶ ◀ ▲ ▼
Blocks:    █ ▓ ▒ ░
Marks:     ✓ ✗ ● ○ ◆ ◇ ■ □ ★
```

## Weight conventions

| Weight       | Chars  | Use for                                  |
|--------------|--------|------------------------------------------|
| Standard     | `─ │`  | Default boxes and connectors             |
| Heavy        | `━ ┃`  | Emphasis — key components, outer frames  |
| Double       | `═ ║`  | Titles, section dividers                 |
| Rounded      | `╭ ╮ ╰ ╯` | External systems, soft boundaries     |

Pick one weight per role and stay consistent inside a single diagram.

## Hard rules

- Monospace assumed; box-drawing requires fixed-width rendering.
- Keep diagrams **under 80 chars wide**. Wrap by stacking, not by line-wrapping the diagram.
- Max **3 levels** of box nesting before readability degrades. If you need more, split.
- Label connections (`HTTP`, `tool call`, `peer DM`) when intent isn't obvious from the boxes.
- Right-pad labels so columns align. Misaligned columns kill scannability.
- Always render the diagram inside a fenced ``` ``` block so copy-paste preserves whitespace.

## Pattern catalog

### Module flow (request/response)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │ ───> │  /api/chat  │ ───> │  agent-api  │
│  useChat v6 │      │   (Next)    │      │  /turn/*    │
└─────────────┘      └──────┬──────┘      └──────┬──────┘
                            │                    │
                            v                    v
                     ┌─────────────┐      ┌─────────────┐
                     │  translator │      │ OwnerAgent  │
                     │    (pure)   │      │    Loop     │
                     └─────────────┘      └─────────────┘
```

Use for: request/response, data flow, module composition.

### Lifecycle / state machine

```
   ┌──────────┐ classification denied
   │  Queued  │ ──────────────────────> RefusedBySender
   └────┬─────┘
        │ inbox claims (idempotent)
        v
   ┌──────────┐  dept PO route
   │ Delivered│ ──────────────> Processing ──> Responded
   └────┬─────┘
        │ TTL
        v
     Expired
```

Use for: durable state, transitions, terminal vs non-terminal states.

### Layered architecture

```
╔════════════════════════════════════════════════════╗
║                     apps/web                       ║
╠════════════════════════════════════════════════════╣
║   ┌──────────┐  ┌──────────┐  ┌──────────────┐    ║
║   │  /chat   │  │ /inbox   │  │ /plus-ones   │    ║
║   └────┬─────┘  └────┬─────┘  └──────┬───────┘    ║
║        │             │               │             ║
║   ┌────┴─────────────┴───────────────┴───────┐    ║
║   │           agent-bridge (pure)            │    ║
║   └──────────────────┬───────────────────────┘    ║
╚══════════════════════│═════════════════════════════╝
                       v
╔════════════════════════════════════════════════════╗
║                     apps/api                       ║
║         HttpApi · /agent/turn* · /peer-msgs        ║
╚════════════════════════════════════════════════════╝
```

Use for: deployment topology, package/app layout.

### Swimlane / sequence

```
Client   ─ POST ──>  Route   ───>  Api   ───>  Loop
                       │            │            │
                       │            │   stream   │
                       │            │ <───────── │
                       │  translate │            │
                       │ <───────── │            │
   <── stream parts ── │            │            │
```

Use for: time-ordered interaction, parallel work across actors.

### File tree

```
apps/web/src/
├── app/
│   ├── api/chat/route.ts            (NEW)
│   └── api/chat/approve/route.ts    (NEW)
├── lib/agent-bridge/
│   ├── turn-event-to-ui-stream.ts   (NEW · pure)
│   └── server-agent-client.ts       (NEW)
└── features/thread/                 (NEW · 6 files)
```

Use for: change manifests, package layouts. Annotate with `(NEW)`, `(MOD)`, `(DEL)`.

### Decision table

```
┌────────────────┬──────────────┬──────────────┐
│ Classification │ Peer hop OK? │ LLM OK?      │
├────────────────┼──────────────┼──────────────┤
│ public         │ yes          │ yes          │
│ internal       │ yes          │ yes          │
│ owner-only     │ same-owner   │ yes          │
│ restricted     │ no           │ no           │
│ phi_quarantine │ no           │ no (never)   │
└────────────────┴──────────────┴──────────────┘
```

Use for: rule matrices, comparison, before/after.

## Annotation conventions

- `(NEW)` `(MOD)` `(DEL)` for change type in file trees.
- `!!` immediately after a label flags risk.
- `[1] [2] [3]` for sequenced steps in a flow.
- `(pure)` `(I/O)` `(state)` for module character.
- `▶` to spotlight the active path in a multi-path diagram.

## Anti-patterns

- **Mixing weights without intent.** If everything is double-line, nothing is emphasized.
- **More than three colors of arrow** (e.g. `─>`, `==>`, `..>`, `-->`). Pick two.
- **Diagrams wider than 80 chars.** Break, stack, or split.
- **Diagrams that re-explain the prose.** A diagram earns its space by showing a structural relationship prose cannot.
- **Nesting beyond 3 levels.** Use a second diagram or a file tree.
