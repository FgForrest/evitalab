# Developer toolkit

As mentioned in the [architecture section](architecture.md), there are several generic modules that provide base UI
components, generic services and so on.

## UI components

You should primarily use components from the [Vuetify](https://vuetifyjs.com/) framework. On top of that, there are several
components in the `modules/base/component` module that extend the standard component set from the Vuetify framework.

The most important are: `VMarkdown` for rendering Markdown markup, `VPropertiesTable` for rendering table of properties
(usually for listing features of model or set data), `VTabToolbar` for building toolbar for tabs, preconfigured components
for CodeMirror editor, some paging helper components and so on.

## Modules support

Basic modules don't need any special treatment. However, if a module wishes to provide or inject some services to or from
the Vue dependency injection, the module can implement the `ModuleRegistrar` where there is support for it. 
The module registrar provides `register(...)` with `ModuleContextBuilder` which has methods for providing and injecting
resources. Because Vue's `inject` and `provide` work only in components, there is a custom logic in the module context 
builder to support this functionality during the bootstrap process. Then, in the actual components, Vue's `inject` can 
be used freely.

The implemented `ModuleRegistrar` then must be registered into the `modules/modules.ts` file so that the bootstrap process
picks it up.

## Connection support

Connections allow accessing the remote evitaDB server, i.e. access schemas, data, and so on. The `connection` module
provides the `Connection` class which is crucial for targeting the correct evitaDB server.
The `ConnectionService` is then able to manage these connections, and provides way to access the data from evitaDB server.

### Internal model and drivers

Because we want to support multiple versions of evitaDB servers from a single instance of evitaLab, there is concept of
evitaDB drivers in place. Each driver supports range of evitaDB server versions and defines how the server data
are accessed and mapped into the internal evitaLab model.

The internal evitaDB model mosty follows the model of evitaDB data model. The important part is that it has builtin 
support for providing info about each property about supportability of a certain driver. This is done using a wrapper
`Value` that provides methods for working with values that might not be supported by each evitaDB driver.

## Workspace support

The workspace module is responsible for constructing the entire UI of evitaLab. All the side panels and tabs are provided
by this module.

Most of the support is provided using the `WorkspaceService`.

### Tabs support

The most important API the workspace module provides is the API for instantiating new tabs. 
To instantiate a new tab, you need an implementation of the `TabDefinition` interface and ideally some factory class for the 
implemented tab definition. 

Then you can instantiate a new tab by passing a new instance of the tab definition to the `workspaceService.createTab(...)`.

### History support

The `WorkspaceService` also provides generic support for history (usually history of executed queries). To use this API,
you just need an implementation of the `TabHistoryKey` with specific value type. Then you just call

```ts
workspaceService.addTabHistoryRecord(key, value)
```

for new record, or

```ts
workspaceService.clearTabHistory(key)
```

to clear or records for your key. The history records are automatically stored into the local storage between sessions,
but the value type needs to be serializable.

## Storage support

There is currently only a very simple storage implementation that uses local storage of the browser. The class is
`LabStorage` that work simply as a key-value map. The key here is to define globally unique key as the storage is 
shared across the entire evitaLab.

## Config support

The configuration of evitaLab (currently very minimal) is represented by the `EvitaLabConfig`.

## Keymap support

There is a system-level support for binding keyboard shortcuts to actions. First, each new keyboard shortcut must be backed by
a command definition (item in `Command` enum), that uniquely identifies the action for documentation purposes and for easier
binding and unbinding the keyboard shortcuts. The command definition must have proper i18n localizations.

Then, a keyboard shortcut must be assigned to the command in the `keyboardShortcutMappings.ts`.

Finally, in a UI component where you want to use the command with keyboard shortcut, simply inject the `Keymap` service:

```ts
const keymap: Keymap = useKeymap()
```

and bind an action to the command:

```ts
onMounted(() => {
    keymap.bind(Command.EntityGrid_ExecuteQuery, tabProps.id, () => executeQuery())
})
onUnmounted(() => {
    keymap.unbind(Command.EntityGrid_ExecuteQuery, tabProps.id)
})
```

Make sure you are correctly unbinding the commands as well when a component is being destroyed, so that the mappings 
are not stacking up in memory and don't overlap with potential new bindings.

## Localization support

We use the [Vue i18n](https://vue-i18n.intlify.dev/) plugin.