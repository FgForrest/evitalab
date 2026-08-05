# `code-editor` — CodeMirror 6 editor wrappers

Abstract module. Wraps CodeMirror 6 into evitaLab-styled components so query consoles and preview
panes share one editor configuration. No `ModuleRegistrar`, no injectable services — components are
imported directly.

## Contents

| File | Purpose |
|------|---------|
| `component/VQueryEditor.vue` | Full editor used by the query consoles (multi-line, language support) |
| `component/VInlineQueryEditor.vue` | Single-line variant for inline query input |
| `component/VPreviewEditor.vue` | Read-only viewer for rendering code/data |
| `component/VPreviewEditorDialog.vue` | `VPreviewEditor` inside a dialog |
| `extension/workspaceStatusBarIntegration.ts` | CodeMirror extension that reports cursor position / selection into the workspace status bar |

## Status-bar integration

`workspaceStatusBarIntegration.ts` is the bridge between an editor instance and the status bar's
editor-status area (`workspace/status-bar/model/editor-status/` — `EditorInfo`, `EditorSelection`,
`EditorStatus`). Adding a new editor surface that should report position/selection means installing
this extension rather than wiring the status bar by hand.

## Related

- [UI components](../ui-components.md) — where these components sit in the catalog
- [`workspace`](workspace.md) — the status bar that consumes the editor state
- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md) — the main consumers
