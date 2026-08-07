# `code-editor` — CodeMirror 6 editor wrappers

Abstract module. Wraps CodeMirror 6 into evitaLab-styled components so query consoles and preview
panes share one editor configuration. No `ModuleRegistrar`, no injectable services — components are
imported directly.

## Contents

| File | Purpose |
|------|---------|
| `component/VQueryEditor.vue` | Full editor used by the query consoles (multi-line, language support) |
| `component/VInlineQueryEditor.vue` | Single-line variant for inline query input (see [the single-line invariant](#the-single-line-invariant)) |
| `component/VPreviewEditor.vue` | Read-only viewer for rendering code/data |
| `component/VPreviewEditorDialog.vue` | `VPreviewEditor` inside a dialog |
| `extension/workspaceStatusBarIntegration.ts` | CodeMirror extension that reports cursor position / selection into the workspace status bar |
| `extension/singleLineDocument.ts` | CodeMirror extension that keeps the document on one line by flattening inserted text |
| `model/flattenToSingleLine.ts` | Pure text-flattening rule used by the extension above |

## The single-line invariant

`VInlineQueryEditor` renders into a fixed-height single row, so its document must never contain a line
break. The invariant is enforced by the `singleLineDocument()` extension, which installs an
`EditorState.transactionFilter`.

Multiline input is **flattened, not rejected**. Whenever a transaction inserts text containing a line
break, the extension rewrites it: every inserted run is passed through `flattenToSingleLine()`, which
trims the individual lines, drops the blank ones and joins the rest with a single space. Both query
languages used here (evitaQL and the GraphQL constraint syntax) are whitespace-insensitive, so a
pretty-printed query pasted into the input keeps its meaning. Rewriting the transaction — rather than
handling the DOM `paste` event — covers pasting, drag & drop and programmatic `dispatch` in one place.

Two consequences worth knowing:

- **`Enter` stays a no-op.** `insertNewlineAndIndent` inserts a line break plus indentation; flattened,
  all of that is blank, so nothing is inserted. No extra keybinding is needed, and
  `completionKeymap`'s `acceptCompletion` is not shadowed. Executing the query is bound globally
  (`Ctrl+Enter`) through the [`keymap`](keymap.md) module, not through the CodeMirror keymap.
- **The caret is repositioned explicitly.** The original transaction's selection points into the
  not-yet-flattened text, so the rewrite places a plain cursor right after the inserted text. A
  multi-range selection collapses to its main cursor. `Transaction.userEvent` is carried over so a
  pasted query is undone by a single `Ctrl+Z`.

The initial document is built by `vue-codemirror` without a transaction, so the filter never sees it.
Callers that seed the editor from persisted or shared tab data must flatten it themselves — see
[`entity-viewer`](entity-viewer.md).

### Known limitation: trailing line comments

Flattening merges a trailing line comment into the code that followed it on the next line. Both
languages have line comments (`#` in GraphQL, `//` in evitaQL), so

```
attributeCodeEquals: "x"   # only shirts
attributeNameContains: "y"
```

becomes `attributeCodeEquals: "x" # only shirts attributeNameContains: "y"` — everything after `#` is
now commented out and the query silently means something else. Stripping comments correctly requires a
per-language lexer (a `#` inside a string literal has to survive), which is out of proportion to the
value; commented queries in an inline single-line input are a fringe case. Accepted as documented
behavior.

## Status-bar integration

`workspaceStatusBarIntegration.ts` is the bridge between an editor instance and the status bar's
editor-status area (`workspace/status-bar/model/editor-status/` — `EditorInfo`, `EditorSelection`,
`EditorStatus`). Adding a new editor surface that should report position/selection means installing
this extension rather than wiring the status bar by hand.

## Related

- [UI components](../ui-components.md) — where these components sit in the catalog
- [`workspace`](workspace.md) — the status bar that consumes the editor state
- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md) — the main consumers
