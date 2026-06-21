# /pr — Reference

## PR title rules

The PR title must pass the current repository's `pr-title` check. If the repo has `commitlint`, validate with the repo's config before creating or updating the PR.

Required shape:

```text
type(scope): subject
# or
type: subject
```

Rules:

- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Subject is lowercase.
- Subject is at most 72 characters.
- No `#<issue>` suffix in the title.

Validate before `gh pr create` when commitlint is available:

```bash
printf '%s\n' "$PR_TITLE" | bunx commitlint
```

## PR body template

Use this exact structure. Three elements. No others. Keep it plain and visual.

````markdown
## Summary

<2-4 short sentences. Outcome first. What changed and why. Written against the issue's problem, not the diff.>

## Flow

```
<ASCII diagram — see ../_shared/ascii-diagrams.md for the character palette and patterns>
```

Closes #<issue>
````

## Which diagram to pick

ASCII diagrams only. Use whichever pattern shows the flow best:

- **Module flow (left to right)** — request/response shapes, data flow through a pipeline, left-to-right causality.

  ```
  ┌──────┐  ─>  ┌──────────┐  ─>  ┌─────────┐
  │ User │      │ Validate │      │ Persist │
  └──────┘      └──────────┘      └─────────┘
  ```

- **Hierarchy (top down)** — decision branches, layered components.

  ```
        ┌─────────┐
        │  Route  │
        └────┬────┘
       ┌─────┴─────┐
       v           v
   ┌───────┐   ┌────────┐
   │ Auth  │   │ Public │
   └───────┘   └────────┘
  ```

- **Sequence / swimlane** — multi-actor interactions, temporal ordering.

  ```
  Client  ─ POST ─>  Route  ───>  Worker
                       │            │
                       │ <───────── │  ack
     <── 200 OK ────── │            │
  ```

- **State diagram** — only if the PR introduces or changes a lifecycle.

  ```
   ┌─────────┐  start  ┌────────┐  finish  ┌──────┐
   │ Pending │ ──────> │ Active │ ───────> │ Done │
   └─────────┘         └────────┘          └──────┘
  ```

Keep diagrams under 80 chars wide.

## Writing the Summary

- Lead with the outcome, not the mechanism.
- Reference the issue's problem phrasing. If the problem was "duplicate invoices on webhook retry," the summary starts with "Prevents duplicate invoices when …", not "Refactors the webhook handler."
- Call out breaking behavior or data migrations in one sentence if they exist.
- No marketing language. No "This PR introduces a new …" filler.
- Prefer concrete nouns and short sentences.

## Dirty repo rule

`/pr` must work when unrelated files are dirty.

- Create a branch automatically when currently on `main`, `master`, or `trunk`.
- Do not stash before branching; Git carries the working tree to the new branch.
- Commit only PR-relevant files.
- Use explicit pathspecs: `git add -- <path>...`.
- Never use `git add -A`, `git add .`, or `git commit -a` when unrelated changes may exist.
- Leave unrelated dirty files unstaged.

## Heredoc invocation pattern

```bash
START_BRANCH="$(git branch --show-current)"
case "$START_BRANCH" in
  main|master|trunk) git switch -c "fix/short-task-title" ;;
esac

git add -- skills/pr/SKILL.md skills/pr/REFERENCE.md
git commit -m "fix(pr): handle dirty worktrees"

BODY_FILE="$(mktemp -t pr-body-XXXXXX.md)"
cat > "$BODY_FILE" <<'EOF'
## Summary

<summary>

## Flow

```
┌──────┐  ─>  ┌──────────┐  ─>  ┌─────────┐
│ User │      │ Validate │      │ Persist │
└──────┘      └──────────┘      └─────────┘
```

Closes #<n>
EOF

git push -u origin "$(git branch --show-current)"
PR_TITLE="fix(pr): handle dirty worktrees"
printf '%s\n' "$PR_TITLE" | bunx commitlint

if gh pr view --json number,url >/tmp/current-pr.json 2>/dev/null; then
  gh pr edit --title "$PR_TITLE" --body-file "$BODY_FILE"
else
  gh pr create --title "$PR_TITLE" --body-file "$BODY_FILE"
fi
rm "$BODY_FILE"
```

## What the PR body is NOT

The PR body is a signal to reviewers: "this is what I shipped and here's the shape of it." It is not:

- A diff summary (GitHub shows the diff).
- A test plan (the issue has verification).
- A changelog entry (changelogs live elsewhere).
- A retrospective (that's `/learn`).

Keep it tight.
