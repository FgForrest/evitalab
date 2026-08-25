# `error-viewer` — error tab

Feature module, and the smallest one that contributes a tab. Shows the full detail of something that
failed to open or execute properly. Contributes `TabType.ErrorViewer`.

- **Provides:** `errorViewerTabFactoryInjectionKey` → `ErrorViewerTabFactory`
- **Injects:** nothing

## Contents

| File | Purpose |
|------|---------|
| `viewer/component/ErrorViewer.vue` | The tab body |
| `viewer/workspace/model/ErrorViewerTabDefinition.ts` | Tab definition |
| `viewer/workspace/model/ErrorViewerTabParams.ts`, `ErrorViewerTabParamsDto.ts` | The error being displayed |
| `viewer/workspace/service/ErrorViewerTabFactory.ts` | Tab factory |

## The error is carried as a summary, not as an error

The params hold an `ErrorSummary` ([`base`](base.md), `base/exception/ErrorSummary.ts`) — name, message,
detail — flattened out of the `LabError` by `ErrorViewerTabFactory.createNew()`. **Do not put the
`LabError` back into the params.** It is abstract with a protected constructor, and its `detail` getter
appends the live `stack` of whatever object it is read from, so a rehydrated error would grow a second
trace on every round trip. The summary is what makes the tab restorable and shareable, and it is what
`toSerializable()` emits (`{ error: { name, message, detail? } }`).

`ErrorSummary.restore()` validates its input — a shared link is untrusted — and normalizes an empty
detail back to `undefined`, which is the state that renders the *No details available.* placeholder.
An error carrying neither a detail nor a stack therefore reaches that placeholder; `LabError.detail`
itself never returns `undefined`, so nothing else can.

Error tabs are persisted (`resolveStorableTabType()` → `TabType.ErrorViewer`, plus the restore switch)
and shareable (`ShareTabButton`, `Command.ErrorViewer_ShareTab` = `Ctrl+L`, resolved by
`SharedTabResolver`). A shared error travels with its whole stack trace — that is the point of sharing
one, but it is worth knowing before pasting the link into a public channel.

## Reporting an error to evitaDB

The `mdi-bug` toolbar button opens a **prefilled new issue in the evitaDB repository**
(`FgForrest/evitaDB`), not in evitaLab's own — what surfaces here comes from the server. The body
template lives in i18n (`errorViewer.issue.*`) and carries the detail in a fenced block together with
the evitaLab build version.

The URL is assembled under a `maxIssueUrlLength` ceiling (6000 chars): a stack trace plus
percent-encoding easily overruns the request line GitHub accepts, so the detail is shortened until the
encoded URL fits and the cut is marked in the body. Nothing is filed by opening the link — GitHub
renders the form and the user submits it.

## Registered early, on purpose

It sits before [`notification`](notification.md) in `src/modules/modules.ts` because the `Toaster`
injects `errorViewerTabFactoryInjectionKey`: an error toast can offer to open the full error here, which
is the main way this tab gets created. [`workspace`](workspace.md) also injects the factory, both so a failed
tab restore can be surfaced as an error tab instead of vanishing and so `WorkspaceService` /
`SharedTabResolver` can restore an error tab of their own.

Because it injects nothing itself, it stays safe to register this early — it is the natural home for
"something went wrong" without dragging dependencies into the bootstrap order.

## Related

- [`notification`](notification.md) — the main creator of these tabs
- [`workspace`](workspace.md) — tab restore failures
- [guidelines — error handling](../guidelines.md#error-handling)
- [`base`](base.md) — `LabError` and friends
