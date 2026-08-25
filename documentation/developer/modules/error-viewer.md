# `error-viewer` — error tab

Feature module, and the smallest one that contributes a tab. Shows the full detail of something that
failed to open or execute properly. Contributes `TabType.ErrorViewer`.

- **Provides:** `errorViewerTabFactoryInjectionKey` → `ErrorViewerTabFactory`
- **Injects:** `tabFactoryRegistryInjectionKey`

## Contents

| File | Purpose |
|------|---------|
| `viewer/component/ErrorViewer.vue` | The tab body |
| `viewer/workspace/model/ErrorViewerTabDefinition.ts` | Tab definition |
| `viewer/workspace/model/ErrorViewerTabParams.ts`, `ErrorViewerTabParamsDto.ts` | The error being displayed |
| `viewer/workspace/service/ErrorViewerTabFactory.ts` | Tab factory |

## Registered early, on purpose

It sits before [`notification`](notification.md) in `src/modules/modules.ts` because the `Toaster`
injects `errorViewerTabFactoryInjectionKey`: an error toast can offer to open the full error here, which
is the main way this tab gets created. [`workspace`](workspace.md) also injects the factory so a failed
tab restore can be surfaced as an error tab instead of vanishing.

Because it injects nothing itself, it stays safe to register this early — it is the natural home for
"something went wrong" without dragging dependencies into the bootstrap order.

## Related

- [`notification`](notification.md) — the main creator of these tabs
- [`workspace`](workspace.md) — tab restore failures
- [guidelines — error handling](../guidelines.md#error-handling)
- [`base`](base.md) — `LabError` and friends
