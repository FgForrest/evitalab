<script setup lang="ts">
import { asError } from '@/utils/error'
/**
 * GraphQL console. Allows to execute GraphQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Compartment, type Extension } from '@codemirror/state'
import { EditorView } from 'codemirror'
import { graphql } from 'cm6-graphql'
import { json } from '@codemirror/lang-json'

import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import {
    GraphQLConsoleService,
    useGraphQLConsoleService
} from '@/modules/graphql-console/console/service/GraphQLConsoleService'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import {
    useGraphQLResultVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { GraphQLConsoleTabParams } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabParams'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { GraphQLSchema, printSchema } from 'graphql'
import VQueryEditor from '@/modules/code-editor/component/VQueryEditor.vue'
import GraphQLConsoleHistory from '@/modules/graphql-console/console/history/component/GraphQLConsoleHistory.vue'
import {
    createGraphQLConsoleHistoryKey,
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryKey'
import type { GraphQLConsoleHistoryKey } from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryKey'
import {
    createGraphQLConsoleHistoryRecord
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryRecord'
import type { GraphQLConsoleHistoryRecord } from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryRecord'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import ResultVisualiser from '@/modules/console/result-visualiser/component/ResultVisualiser.vue'
import { Command } from '@/modules/keymap/model/Command'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import VTabToolbarActionGroup from '@/modules/base/component/VTabToolbarActionGroup.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import VExecuteQueryButton from '@/modules/base/component/VExecuteQueryButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import VSideTabs from '@/modules/base/component/VSideTabs.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import { List as ImmutableList } from 'immutable'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { minifyGraphQL, prettifyGraphQL } from '@/modules/code-editor/service/formatGraphQL'
import { minifyJson, prettifyJson } from '@/modules/code-editor/service/formatJson'
import { DocumentFormattingMode } from '@/modules/code-editor/model/DocumentFormattingMode'

enum EditorTabType {
    Query = 'query',
    Variables = 'variables',
    History = 'history',
    Schema = 'schema'
}

enum ResultTabType {
    Raw = 'raw',
    Visualiser = 'visualiser'
}

/**
 * Upper bound for the initial GraphQL schema introspection. On expiry the request is aborted and the tab
 * switches to its error/retry state instead of showing the loading screen indefinitely.
 */
const schemaLoadTimeoutMs = 15_000

const keymap: Keymap = useKeymap()
const graphQLConsoleService: GraphQLConsoleService = useGraphQLConsoleService()
const workspaceService: WorkspaceService = useWorkspaceService()
const visualiserService: ResultVisualiserService = useGraphQLResultVisualiserService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<GraphQLConsoleTabParams, GraphQLConsoleTabData>>()
const emit = defineEmits<TabComponentEvents>()
defineExpose<TabComponentExpose>({
    path(): SubjectPath {
        const pathItems: SubjectPathItem[] = []
        if (props.params.dataPointer.instanceType !== GraphQLInstanceType.System) {
            pathItems.push(SubjectPathItem.plain(props.params.dataPointer.catalogName))
        }
        pathItems.push(SubjectPathItem.significant(
            GraphQLConsoleTabDefinition.icon(),
            t(`graphQLConsole.instanceType.${props.params.dataPointer.instanceType}`)
        ))
        return new ConnectionSubjectPath(props.params.dataPointer.connection, pathItems)
    },
    retry(): void {
        initialize()
    }
})

const title: ImmutableList<string> = (() => {
    const title: string[] = []
    if (props.params.dataPointer.instanceType !== GraphQLInstanceType.System) {
        title.push(props.params.dataPointer.catalogName)
    }
    title.push(t(`graphQLConsole.instanceType.${props.params.dataPointer.instanceType}`))
    return ImmutableList(title)
})()

const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const queryPanelVisible = ref<boolean>(true)
const resultPanelVisible = ref<boolean>(props.params.executeOnOpen)
/**
 * Panel the caret currently sits in. Both panels are visible at once, so the selected view alone does not
 * say which editor a formatting action should apply to. The state is sticky — it only changes when the
 * other panel takes focus — so clicking a toolbar button cannot make that button disappear under the
 * cursor.
 */
const focusedPanel = ref<'query' | 'result'>('query')
const bothPanelsHidden = computed<boolean>(() => !queryPanelVisible.value && !resultPanelVisible.value)
/**
 * The result panel starts hidden so that a fresh console offers the full width to the query, and opens
 * itself when the first result arrives. Any later execution respects whatever the user chose since.
 */
let firstResultPending: boolean = true

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

const graphQLSchema = ref<GraphQLSchema>()
const graphQLSchemaChangeCallbackId = graphQLConsoleService.registerGraphQLSchemaChangeCallback(
    props.params.dataPointer,
    async () => await loadGraphQLSchema()
)
const reloadingSchema = ref<boolean>(false)

const queryEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const queryCode = ref<string>(props.data.query ? props.data.query : t('graphQLConsole.placeholder.writeQuery', { catalogName: props.params.dataPointer.catalogName }))
// GraphQL language support is swapped in place through a CodeMirror compartment so the
// editor's extensions array reference stays stable; reassigning it would force the editor
// to fully remount on every schema (re)load.
const queryEditorView = ref<EditorView>()
const queryLanguageCompartment = new Compartment()
let queryLanguageExtension: Extension = []
const queryExtensions: Extension[] = [queryLanguageCompartment.of([])]

const variablesEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const variablesCode = ref<string>(props.data.variables ? props.data.variables : '{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const historyRef = ref<InstanceType<typeof GraphQLConsoleHistory> | undefined>()
const historyKey = computed<GraphQLConsoleHistoryKey>(() => createGraphQLConsoleHistoryKey(props.params.dataPointer))
const historyRecords = computed<GraphQLConsoleHistoryRecord[]>(() => {
    return [...workspaceService.getTabHistoryRecords(historyKey.value)].reverse()
})
function pickHistoryRecord(record: GraphQLConsoleHistoryRecord): void {
    queryCode.value = record[1] || ''
    variablesCode.value = record[2] || ''
    editorTab.value = EditorTabType.Query
    queryPanelVisible.value = true
    setTimeout(() => queryEditorRef.value?.focus())
}
function clearHistory(): void {
    workspaceService.clearTabHistory(historyKey.value)
}

const schemaEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const schemaEditorInitialized = ref<boolean>(false)
const schemaCode = ref<string>('')
const schemaExtensions: Extension[] = [graphql()]

const lastAppliedQueryCode = ref<string>('')
const rawResultEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]

const resultVisualiserRef = ref<InstanceType<typeof ResultVisualiser> | undefined>()
const supportsVisualisation = computed<boolean>(() => {
    return props.params.dataPointer.instanceType === GraphQLInstanceType.Data
})

const loading = ref<boolean>(false)
const initialized = ref<boolean>(false)

const currentData = computed<GraphQLConsoleTabData>(() => {
    return new GraphQLConsoleTabData(queryCode.value, variablesCode.value)
})
watch(currentData, (data) => {
    emit('update:data', data)
})

const formattingAvailable = computed<boolean>(() =>
    queryPanelVisible.value &&
    focusedPanel.value === 'query' &&
    (editorTab.value === EditorTabType.Query || editorTab.value === EditorTabType.Variables)
)

/**
 * Reformats the editor the caret sits in — the query with the GraphQL printer, the variables as JSON.
 * The new document is assigned to the bound model, which resets the caret to the document start.
 */
async function formatFocusedEditor(mode: DocumentFormattingMode): Promise<void> {
    if (!formattingAvailable.value) {
        return
    }
    try {
        if (editorTab.value === EditorTabType.Query) {
            queryCode.value = mode === DocumentFormattingMode.Prettify
                ? prettifyGraphQL(queryCode.value)
                : minifyGraphQL(queryCode.value)
        } else {
            variablesCode.value = mode === DocumentFormattingMode.Prettify
                ? prettifyJson(variablesCode.value)
                : minifyJson(variablesCode.value)
        }
    } catch (e) {
        await toaster.error(t('graphQLConsole.notification.failedToFormatDocument'), asError(e))
    }
}

async function loadGraphQLSchema(signal?: AbortSignal): Promise<void> {
    const schema: GraphQLSchema = await graphQLConsoleService.getGraphQLSchema(props.params.dataPointer, signal)
    graphQLSchema.value = schema
    queryLanguageExtension = graphql(schema)
    applyQueryLanguage()
    // keep the schema viewer tab in sync when the schema is reloaded after it was already displayed
    if (schemaEditorInitialized.value) {
        schemaCode.value = printSchema(schema)
    }
}

/**
 * Reconfigures the query editor's language compartment with the currently loaded GraphQL
 * schema. Safe to call before the editor exists (no-op until its view is available).
 */
function applyQueryLanguage(): void {
    queryEditorView.value?.dispatch({
        effects: queryLanguageCompartment.reconfigure(queryLanguageExtension)
    })
}

// apply the already-loaded language once the editor view becomes available
watch(queryEditorView, () => applyQueryLanguage())

/**
 * Loads the GraphQL schema (bounded by a request timeout) and marks the tab ready. On any failure —
 * including a timed-out/aborted introspection — reports the error to the tab framework so it can offer
 * a retry, instead of leaving the tab stuck behind the loading screen. Reused by both mount and retry.
 */
function initialize(): void {
    loadGraphQLSchema(AbortSignal.timeout(schemaLoadTimeoutMs))
        .then(() => {
            initialized.value = true
            emit('ready')

            if (props.params.executeOnOpen) {
                executeQuery()
            }
        })
        .catch(error => {
            emit('error', asError(error))
        })
}

async function refreshGraphQLSchema(): Promise<void> {
    reloadingSchema.value = true
    try {
        // re-introspects first; only when the schema really changed does the registered change callback
        // perform the actual reload, so a failed reload leaves the console with the schema it had
        await graphQLConsoleService.refreshGraphQLSchema(props.params.dataPointer)
    } catch (error) {
        await toaster.error(t('graphQLConsole.notification.failedToReloadSchema'), asError(error))
    } finally {
        reloadingSchema.value = false
    }
}

onBeforeMount(() => {
    initialize()
})
onMounted(() => {
    // register console specific keyboard shortcuts
    keymap.bind(Command.GraphQLConsole_ExecuteQuery, props.id, executeQuery)
    keymap.bind(Command.GraphQLConsole_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.GraphQLConsole_Query_QueryEditor, props.id, () => {
        editorTab.value = EditorTabType.Query
        queryPanelVisible.value = true
        focusQueryEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_VariablesEditor, props.id, () => {
        editorTab.value = EditorTabType.Variables
        queryPanelVisible.value = true
        focusVariablesEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_History, props.id, () => {
        editorTab.value = EditorTabType.History
        queryPanelVisible.value = true
        focusHistory()
    })
    keymap.bind(Command.GraphQLConsole_Query_SchemaViewer, props.id, () => {
        editorTab.value = EditorTabType.Schema
        queryPanelVisible.value = true
        focusSchemaEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_Prettify, props.id, () =>
        formatFocusedEditor(DocumentFormattingMode.Prettify)
    )
    keymap.bind(Command.GraphQLConsole_Query_Minify, props.id, () =>
        formatFocusedEditor(DocumentFormattingMode.Minify)
    )
    keymap.bind(Command.GraphQLConsole_Query_TogglePanel, props.id, () => {
        queryPanelVisible.value = !queryPanelVisible.value
    })
    keymap.bind(Command.GraphQLConsole_Result_RawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        resultPanelVisible.value = true
        focusRawResultEditor()
    })
    keymap.bind(Command.GraphQLConsole_Result_ResultVisualizer, props.id, () => {
        resultTab.value = ResultTabType.Visualiser
        resultPanelVisible.value = true
        focusResultVisualiser()
    })
    keymap.bind(Command.GraphQLConsole_Result_TogglePanel, props.id, () => {
        resultPanelVisible.value = !resultPanelVisible.value
    })

    focusQueryEditor()
})
onUnmounted(() => {
    graphQLConsoleService.unregisterGraphQLSchemaChangeCallback(
        props.params.dataPointer,
        graphQLSchemaChangeCallbackId
    )

    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.GraphQLConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.GraphQLConsole_ShareTab, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_QueryEditor, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_VariablesEditor, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_History, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_SchemaViewer, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_Prettify, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_Minify, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_TogglePanel, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_RawResultViewer, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_ResultVisualizer, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_TogglePanel, props.id)
})

async function executeQuery(): Promise<void> {
    try {
        workspaceService.addTabHistoryRecord(historyKey.value, createGraphQLConsoleHistoryRecord(queryCode.value, variablesCode.value))
    } catch (e) {
        await toaster.error(t('graphQLConsole.notification.failedToSaveQueryToHistory'), asError(e))
    }

    loading.value = true
    try {
        resultCode.value = await graphQLConsoleService.executeGraphQLQuery(props.params.dataPointer, queryCode.value, JSON.parse(variablesCode.value))
        loading.value = false
        lastAppliedQueryCode.value = queryCode.value

        if (firstResultPending) {
            firstResultPending = false
            resultPanelVisible.value = true
        }

        if (resultTab.value === ResultTabType.Raw) {
            focusRawResultEditor()
        }
    } catch (error) {
        loading.value = false
        await toaster.error('Could not execute query', asError(error)) // todo lho i18n
    }
}

function initializeSchemaEditor(): void {
    if (!schemaEditorInitialized.value) {
        if (graphQLSchema.value) {
            schemaCode.value = printSchema(graphQLSchema.value as GraphQLSchema)
            schemaEditorInitialized.value = true
        } else {
            schemaCode.value = ''
        }
    }
}

// the focused panel is recorded up front rather than left to the `focusin` the deferred focus() will
// fire — a view that is not mounted yet swallows the call, and the state would keep pointing at the
// panel the caret has just left
function focusQueryEditor(): void {
    focusedPanel.value = 'query'
    setTimeout(() => queryEditorRef.value?.focus())
}
function focusVariablesEditor(): void {
    focusedPanel.value = 'query'
    setTimeout(() => variablesEditorRef.value?.focus())
}
function focusHistory(): void {
    focusedPanel.value = 'query'
    setTimeout(() => historyRef.value?.focus())
}
function focusSchemaEditor(): void {
    focusedPanel.value = 'query'
    setTimeout(() => schemaEditorRef.value?.focus())
}
function focusRawResultEditor(): void {
    focusedPanel.value = 'result'
    setTimeout(() => rawResultEditorRef.value?.focus())
}
function focusResultVisualiser(): void {
    focusedPanel.value = 'result'
    setTimeout(() => resultVisualiserRef.value?.focus())
}
</script>

<template>
    <div v-if="initialized" class="graphql-editor">
        <VTabToolbar :prepend-icon="GraphQLConsoleTabDefinition.icon()" :title="title">
            <template #append>
                <VTabToolbarActionGroup v-if="formattingAvailable">
                    <VBtn
                        icon
                        density="compact"
                        @click="formatFocusedEditor(DocumentFormattingMode.Prettify)"
                    >
                        <VIcon>mdi-auto-fix</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_Prettify">
                            {{ t('common.button.prettify') }}
                        </VActionTooltip>
                    </VBtn>

                    <VBtn
                        icon
                        density="compact"
                        @click="formatFocusedEditor(DocumentFormattingMode.Minify)"
                    >
                        <VIcon>mdi-arrow-collapse-vertical</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_Minify">
                            {{ t('common.button.minify') }}
                        </VActionTooltip>
                    </VBtn>
                </VTabToolbarActionGroup>

                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.GraphQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :command="Command.GraphQLConsole_ShareTab"
                />

                <!-- TODO implement -->
<!--                <VBtn-->
<!--                    icon-->
<!--                    density="compact"-->
<!--                >-->
<!--                    <VIcon>mdi-information-outline</VIcon>-->
<!--                    <VTooltip activator="parent">-->
<!--                        {{ t('graphQLConsole.button.instanceDetails') }}-->
<!--                    </VTooltip>-->
<!--                </VBtn>-->

                <VBtn :loading="reloadingSchema" icon density="compact" @click="refreshGraphQLSchema()">
                    <VIcon>mdi-refresh</VIcon>
                    <VActionTooltip activator="parent">
                        {{ t('graphQLConsole.button.reloadSchema') }}
                    </VActionTooltip>
                </VBtn>

                <VExecuteQueryButton
                    :loading="loading"
                    @click="executeQuery"
                    :title="t('common.button.run')"
                    :command="Command.GraphQLConsole_ExecuteQuery">
                </VExecuteQueryButton>
            </template>
        </VTabToolbar>

        <div class="graphql-editor__body">
            <VSheet class="graphql-editor-query-sections">
                <VSideTabs
                    v-model="editorTab"
                    v-model:visible="queryPanelVisible"
                    side="left"
                    collapsible
                >
                    <VTab :value="EditorTabType.Query">
                        <VIcon>mdi-database-search</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_QueryEditor">
                            {{ t('graphQLConsole.tooltip.queryEditorView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_VariablesEditor">
                            {{ t('graphQLConsole.tooltip.variablesEditorView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_History">
                            {{ t('graphQLConsole.tooltip.historyView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Schema">
                        <VIcon>mdi-file-code</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_SchemaViewer">
                            {{ t('graphQLConsole.tooltip.schemaViewerView') }}
                        </VActionTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>

            <div class="graphql-editor__panes-area">
                <Splitpanes
                    vertical
                    :class="[
                        'graphql-editor__panes',
                        { 'graphql-editor__panes--collapsed': !queryPanelVisible || !resultPanelVisible }
                    ]"
                >
                    <Pane
                        :class="[
                            'graphql-editor-pane',
                            { 'graphql-editor-pane--hidden': !queryPanelVisible },
                            { 'graphql-editor-pane--full': queryPanelVisible && !resultPanelVisible }
                        ]"
                        @focusin="focusedPanel = 'query'"
                    >
                        <VWindow
                            v-model="editorTab"
                            direction="vertical"
                        >
                            <VWindowItem :value="EditorTabType.Query">
                                <VQueryEditor
                                    ref="queryEditorRef"
                                    v-model="queryCode"
                                    :additional-extensions="queryExtensions"
                                    @update:editor="queryEditorView = $event.view"
                                />
                            </VWindowItem>

                            <VWindowItem :value="EditorTabType.Variables">
                                <VQueryEditor
                                    ref="variablesEditorRef"
                                    v-model="variablesCode"
                                    :additional-extensions="variablesExtensions"
                                />
                            </VWindowItem>

                            <VWindowItem :value="EditorTabType.History">
                                <GraphQLConsoleHistory
                                    ref="historyRef"
                                    :items="historyRecords"
                                    @select-history-record="pickHistoryRecord"
                                    @update:clear-history="clearHistory"
                                />
                            </VWindowItem>

                            <VWindowItem :value="EditorTabType.Schema" @group:selected="initializeSchemaEditor">
                                <VPreviewEditor
                                    ref="schemaEditorRef"
                                    v-model="schemaCode"
                                    :additional-extensions="schemaExtensions"
                                    style="height: 100%"
                                />
                            </VWindowItem>
                        </VWindow>
                    </Pane>

                    <Pane
                        min-size="20"
                        :class="[
                            'graphql-editor-pane',
                            { 'graphql-editor-pane--hidden': !resultPanelVisible },
                            { 'graphql-editor-pane--full': resultPanelVisible && !queryPanelVisible }
                        ]"
                        @focusin="focusedPanel = 'result'"
                    >
                        <VWindow
                            v-model="resultTab"
                            direction="vertical"
                        >
                            <VWindowItem :value="ResultTabType.Raw">
                                <VPreviewEditor
                                    v-if="resultTab === ResultTabType.Raw"
                                    ref="rawResultEditorRef"
                                    v-model="resultCode"
                                    :placeholder="t('graphQLConsole.placeholder.results')"
                                    read-only
                                    :additional-extensions="resultExtensions"
                                />
                            </VWindowItem>

                            <VWindowItem v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                                <ResultVisualiser
                                    v-if="resultTab === ResultTabType.Visualiser"
                                    ref="resultVisualiserRef"
                                    :catalog-pointer="params.dataPointer"
                                    :visualiser-service="visualiserService"
                                    :input-query="lastAppliedQueryCode || ''"
                                    :result="resultCode == undefined || !resultCode ? undefined : JSON.parse(resultCode)"
                                />
                            </VWindowItem>
                        </VWindow>
                    </Pane>
                </Splitpanes>

                <VMissingDataIndicator
                    v-if="bothPanelsHidden"
                    class="graphql-editor__no-panels"
                    icon="mdi-arrow-expand-horizontal"
                    :title="t('graphQLConsole.placeholder.noPanelsVisible')"
                >
                    <template #actions>
                        <VBtn variant="outlined" @click="queryPanelVisible = true">
                            {{ t('graphQLConsole.button.showQueryPanel') }}
                        </VBtn>
                        <VBtn variant="outlined" @click="resultPanelVisible = true">
                            {{ t('graphQLConsole.button.showResultPanel') }}
                        </VBtn>
                    </template>
                </VMissingDataIndicator>
            </div>

            <VSheet class="graphql-editor-result-sections">
                <VSideTabs
                    v-model="resultTab"
                    v-model:visible="resultPanelVisible"
                    side="right"
                    collapsible
                >
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Result_RawResultViewer">
                            {{ t('graphQLConsole.tooltip.rawResultViewerView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Result_ResultVisualizer">
                            {{ t('graphQLConsole.tooltip.resultVisualizerView') }}
                        </VActionTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.graphql-editor {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        display: grid;
        grid-template-columns: 3rem 1fr 3rem;
    }

    // takes the place of the panes in the body grid so that the both-panels-hidden indicator can
    // overlay only the panes, not the side tab strips
    &__panes-area {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    &__panes {
        // a collapsed pane is positioned against the panes container, not the whole tab area
        position: relative;

        &--collapsed :deep(.splitpanes__splitter) {
            display: none;
        }
    }

    &__no-panels {
        position: absolute;
        inset: 0;
        background: rgb(var(--v-theme-background));
    }
}

.graphql-editor-pane {
    // collapsing a panel is a discrete state change; splitpanes' width animation and the compositor
    // promotion that goes with it would both turn it into a visible two-step
    transition: none !important;
    will-change: auto !important;

    & :deep(.v-window) {
        // we need to override the default tab window styles used in LabEditor
        position: absolute;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
    }

    // A collapsed pane keeps its box at its original size, and stays anchored to the edge it already
    // sits at, so the editors inside never re-measure and never appear to move. It also has to stay
    // below its surviving sibling — the editors are composited scrollers whose layer can outlive the
    // frame that hid them.
    &--hidden {
        position: absolute;
        top: 0;
        bottom: 0;
        visibility: hidden;
        z-index: 0;

        &:first-child {
            left: 0;
        }

        &:last-child {
            right: 0;
        }
    }

    // the width overrides the inline one splitpanes writes on the pane element
    &--full {
        width: 100% !important;
        z-index: 1;
    }
}

.graphql-editor-query-sections, .graphql-editor-result-sections {
    display: flex;
    width: 3rem;
}
</style>
