# Plain Senior Output

Use this contract for user-facing output from every workflow skill.

## Rule

Start with the decision. Then show the proof. Then show the next move.

Plain Senior means short, concrete, human prose. It does not mean childish prose.

## Default shape

Use this shape unless the skill needs a stricter artifact format:

````markdown
## Decision
<one sentence>

## Why
<plain reason, tied to evidence>

## Example
```ts
<small code, ASCII diagram, command, diff, or pseudocode>
```

## Risk
<what could still fail, or "None known">

## Next
<exact handoff or command>
````

## Information density (Tufte)

> Above all else, show the data. — Edward Tufte

- Subtract anything that isn't carrying meaning.
- One screen by default.
- One idea per paragraph.
- Active voice.
- Concrete nouns.
- Short headings.
- Bullets only when they help scanning.
- No ceremony sections.
- No repeated summaries.
- No unexplained jargon. Define it inline in six words or fewer.
- No hedge words that hide the decision.

## Diagrams

**ASCII diagrams only.** No mermaid. See `./ascii-diagrams.md` for the character palette, weight conventions, and pattern catalog.

A diagram earns its space only when it shows a structural relationship that prose cannot. If prose works, skip the diagram.

## Examples

Use a command example for workflow status:

```bash
gh pr checks 42 --watch --fail-fast
```

Use a code example for an interface or mechanism:

```ts
type RetryPolicy = {
  readonly attempts: number
  readonly delayMs: number
}
```

Use a diff when the skill proposes a text change:

```diff
- Hidden fallback returns cached data.
+ Provider failure returns a typed error.
```

Use an ASCII diagram when structure matters more than words:

```
┌───────┐  ─>  ┌──────────┐  ─>  ┌─────────┐
│ Input │      │ Validate │      │ Execute │
└───────┘      └──────────┘      └─────────┘
```

## Every final output includes one example

Command, code, diff, ASCII diagram, pseudocode, or exact file path. Pick the form that makes the decision provable.

## Forbidden

- Mermaid diagrams. Use ASCII.
- Long mechanical templates when three sections would do.
- Tables with more than five columns.
- Lists of files when a behavior summary is clearer.
- "Basically," "essentially," "it is worth noting," and similar filler.
- Restating the user's request before answering.
- Trailing summaries when the diff or output is visible.
