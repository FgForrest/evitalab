# `code-editor` — CodeMirror 6 editor wrappers

Abstract module. Wraps CodeMirror 6 into evitaLab-styled components so query consoles and preview
panes share one editor configuration. No `ModuleRegistrar` — components and services are imported
directly. The text and query transformations in `service/` are plain exported functions: they are
stateless and dependency-free, so there is nothing for DI to resolve, but they are business logic and
so live in `service/`, not `model/` (see the [module layout](index.md)).

## Contents

| File | Purpose |
|------|---------|
| `component/VQueryEditor.vue` | Full editor used by the query consoles (multi-line, language support) |
| `component/VInlineQueryEditor.vue` | Single-line variant for inline query input (see [the single-line invariant](#the-single-line-invariant)) |
| `component/VPreviewEditor.vue` | Read-only viewer for rendering code/data |
| `component/VPreviewEditorDialog.vue` | `VPreviewEditor` inside a dialog |
| `extension/workspaceStatusBarIntegration.ts` | CodeMirror extension that reports cursor position / selection into the workspace status bar |
| `extension/singleLineDocument.ts` | CodeMirror extension that keeps the document on one line by flattening inserted text |
| `service/flattenToSingleLine.ts` | Pure text-flattening rule used by the extension above |
| `service/formatEvitaQL.ts` | `prettifyEvitaQL` / `minifyEvitaQL` — evitaQL printer over the lezer parse tree |
| `service/formatGraphQL.ts` | `prettifyGraphQL` / `minifyGraphQL` — wrappers over `graphql-js` |
| `service/formatJson.ts` | `prettifyJson` / `minifyJson` |
| `model/DocumentFormattingMode.ts` | `Prettify` / `Minify` — which direction a formatter is applied in |
| `exception/DocumentFormattingError.ts` | Thrown by every formatter when it refuses |

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

## Document formatters

Three pairs of pure functions (`prettify*` / `minify*`) back the prettify & minify toolbar buttons of
both consoles. They take a document, return a document, and know nothing about Vue, CodeMirror or DI —
the consoles assign the result to the editor's bound `ref`. Every one of them throws
`DocumentFormattingError` instead of returning a broken or empty document; callers wrap them in
try/catch and report through `useToaster().error(...)`.

**Refusing is a feature.** All six functions reject a document they cannot fully understand, and both
minifiers additionally reject a document that would collapse to nothing. Both consoles open with a
comment-only placeholder, so "minify wipes the editor on the first click" is otherwise the very first
thing a user would hit.

### evitaQL

`formatEvitaQL.ts` walks the lezer parse tree of `evitaQLQueryLanguage.parser` (exported by
`@lukashornych/codemirror-lang-evitaql`) and re-emits the query from the nodes. Nothing is
regex-rewritten, so a comma inside a string literal (`attributeContent("code, weird")`) can never be
mistaken for an argument separator.

- **Indent unit is two spaces** — CodeMirror's `indentUnit` default under `basicSetup`, so typing after
  a format continues in the same rhythm the printer produced.
- A constraint whose arguments contain **another constraint or a comment** breaks: one argument per
  line. A leaf constraint stays on a single line — `attributeEquals("code", "shirt")`.
- A `Range` (`[a, b]`) always stays inline; its whitespace is collapsed rather than rebuilt, so an open
  range (`[1, ]`) stays open.
- **Prettify keeps `//` comments**, each on a line of its own at the current indent. A comment sitting
  between a constraint name and its `(` is lifted onto the line above — left in place it would comment
  out the arguments the moment the query is collapsed.
- **Minify drops comments.** evitaQL has no block comment, so a `//` comment cannot survive a collapse
  onto one line without commenting out everything after it. This is why minify does **not** reuse
  `flattenToSingleLine()`, which would do exactly that.
- The printer refuses on **any** error node in the tree.

> **Known limitation — `head(...)`.** The bundled grammar (`1.5.1`) does not know the `head()` root
> constraint, so a query using it parses with error nodes and both formatters refuse it. This is a
> grammar-version limitation, not a printer bug; it disappears when the language package gains `head`
> support. The printer itself is grammar-driven and needs no change for it.

The printer depends only on the exported parser plus the lezer cursor API, so it can be moved into
`@lukashornych/codemirror-lang-evitaql` later without redesign.

### GraphQL

`formatGraphQL.ts` is a thin wrapper: prettify is `print(parse(source))`, minify is
`stripIgnoredCharacters(source)`, both from `graphql@16` (already a dependency).

> **Prettify is lossy, by design.** `print()` works on the parsed document, which carries no comments,
> so `#` comments are dropped, and an anonymous `query { … }` is rewritten into the shorthand `{ … }`.
> graphql-js has no comment-preserving printer; the alternative was not to offer GraphQL prettify at
> all. Named operations keep their name. This is pinned by a test in
> `test/modules/code-editor/formatGraphQL.test.ts`.

`stripIgnoredCharacters()` only tokenizes, so it accepts lexically valid but ungrammatical input —
acceptable, since it cannot corrupt what it does not understand.

## Status-bar integration

`workspaceStatusBarIntegration.ts` is the bridge between an editor instance and the status bar's
editor-status area (`workspace/status-bar/model/editor-status/` — `EditorInfo`, `EditorSelection`,
`EditorStatus`). Adding a new editor surface that should report position/selection means installing
this extension rather than wiring the status bar by hand.

## Related

- [UI components](../ui-components.md) — where these components sit in the catalog
- [`workspace`](workspace.md) — the status bar that consumes the editor state
- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md) — the main consumers
