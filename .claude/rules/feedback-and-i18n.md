# Error feedback and i18n

Before reporting an error to the user or adding a user-facing string, read
[guidelines — error handling](../../documentation/developer/guidelines.md#error-handling) and
[i18n — rules](../../documentation/developer/i18n.md#rules). The traps:

- **`toaster.error(title, e)`** — pass the caught error as the second argument; never interpolate `errorMessage(e)`
  into the title (the notification layer can no longer classify it).
- Get the toaster through `useToaster()`, never `vue-toastification` directly.
- **Do not suppress or deduplicate connectivity errors at the call site**; `ConnectivityAwareToaster` does it
  centrally. Never swallow errors silently.
- **Every user-facing string goes through i18n**, in components and in services.
- **Domain enum labels shown by more than one feature live in `common.<enum>`**, keyed by the enum's raw value and
  covering all values (`common.scope.*`, `common.cardinality.*`). A feature never reads another feature's namespace.
- Reuse `common.*` wording before adding new keys; follow the existing sub-structure of the namespace you edit.
