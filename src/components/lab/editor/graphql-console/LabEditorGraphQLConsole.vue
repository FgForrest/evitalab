<script setup lang="ts">
/**
 * GraphQL console. Allows to execute GraphQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state'
import { graphql } from 'cm6-graphql'
import { json } from '@codemirror/lang-json'

import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { GraphQLConsoleService, useGraphQLConsoleService } from '@/services/editor/graphql-console.service'
import { GraphQLSchema, printSchema } from 'graphql'
import { Toaster, useToaster } from '@/services/editor/toaster'
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import VSideTabs from '@/components/base/VSideTabs.vue'
import LabEditorResultVisualiser from '@/components/lab/editor/result-visualiser/LabEditorResultVisualiser.vue'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import {
    useGraphQLResultVisualiserService
} from '@/services/editor/result-visualiser/graphql-result-visualiser.service'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'

import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorGraphQLConsoleHistory from '@/components/lab/editor/graphql-console/LabEditorGraphQLConsoleHistory.vue'
import { UnexpectedError } from '@/model/lab'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import VQueryEditor from '@/components/base/VQueryEditor.vue'
import VPreviewEditor from '@/components/base/VPreviewEditor.vue'
import { Command } from '@/model/editor/keymap/Command'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { TabComponentProps } from '@/model/editor/tab/TabComponentProps'
import { GraphQLConsoleParams } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleParams'
import { GraphQLConsoleData } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleData'
import { TabComponentEvents } from '@/model/editor/tab/TabComponentEvents'
import { GraphQLInstanceType } from '@/model/editor/tab/graphQLConsole/GraphQLInstanceType'
import {
    createGraphQLConsoleHistoryKey,
    GraphQLConsoleHistoryKey
} from '@/model/editor/tab/graphQLConsole/history/GraphQLConsoleHistoryKey'
import {
    createGraphQLConsoleHistoryRecord,
    GraphQLConsoleHistoryRecord
} from '@/model/editor/tab/graphQLConsole/history/GraphQLConsoleHistoryRecord'
import { TabType } from '@/model/editor/tab/TabType'

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

const keymap: Keymap = useKeymap()
const graphQLConsoleService: GraphQLConsoleService = useGraphQLConsoleService()
const editorService: EditorService = useEditorService()
const visualiserService: ResultVisualiserService = useGraphQLResultVisualiserService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<GraphQLConsoleParams, GraphQLConsoleData>>()
const emit = defineEmits<TabComponentEvents>()

const path = ref<string[]>([])
if (props.params.instancePointer.instanceType !== GraphQLInstanceType.System) {
    path.value.push(props.params.instancePointer.catalogName)
}
path.value.push(props.params.instancePointer.instanceType) // todo lho i18n
const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const shareTabButtonRef = ref<InstanceType<typeof LabEditorTabShareButton> | undefined>()

const graphQLSchema = ref<GraphQLSchema>()

const queryEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const queryCode = ref<string>(props.data.query ? props.data.query : `# Write your GraphQL query for catalog ${props.params.instancePointer.catalogName} here.\n`)
const queryExtensions: Extension[] = []

const variablesEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const variablesCode = ref<string>(props.data.variables ? props.data.variables : '{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const historyRef = ref<InstanceType<typeof LabEditorGraphQLConsoleHistory> | undefined>()
const historyKey = computed<GraphQLConsoleHistoryKey>(() => createGraphQLConsoleHistoryKey(props.params.instancePointer))
const historyRecords = computed<GraphQLConsoleHistoryRecord[]>(() => {
    return [...editorService.getTabHistoryRecords(historyKey.value)].reverse()
})
function pickHistoryRecord(record: GraphQLConsoleHistoryRecord): void {
    queryCode.value = record[1] || ''
    variablesCode.value = record[2] || ''
    editorTab.value = EditorTabType.Query
    setTimeout(() => queryEditorRef.value?.focus())
}
function clearHistory(): void {
    editorService.clearTabHistory(historyKey.value)
}

const schemaEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const schemaEditorInitialized = ref<boolean>(false)
const schemaCode = ref<string>('')
const schemaExtensions: Extension[] = [graphql()]

const lastAppliedQueryCode = ref<string>('')
const rawResultEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]

const resultVisualiserRef = ref<InstanceType<typeof LabEditorResultVisualiser> | undefined>()
const supportsVisualisation = computed<boolean>(() => {
    return props.params.instancePointer.instanceType === GraphQLInstanceType.Data
})

const loading = ref<boolean>(false)
const initialized = ref<boolean>(false)

const currentData = computed<GraphQLConsoleData>(() => {
    return new GraphQLConsoleData(queryCode.value, variablesCode.value)
})
watch(currentData, (data) => {
    emit('dataUpdate', data)
})

onBeforeMount(() => {
    graphQLConsoleService.getGraphQLSchema(props.params.instancePointer)
        .then(schema => {
            graphQLSchema.value = schema
            queryExtensions.push(graphql(schema))
            initialized.value = true
            emit('ready')

            if (props.params.executeOnOpen) {
                executeQuery()
            }
        })
        .catch(error => {
            toaster.error(error)
        })
})
onMounted(() => {
    // register console specific keyboard shortcuts
    keymap.bind(Command.GraphQLConsole_ExecuteQuery, props.id, executeQuery)
    keymap.bind(Command.GraphQLConsole_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.GraphQLConsole_Query_SwitchToQueryEditor, props.id, () => {
        editorTab.value = EditorTabType.Query
        focusQueryEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_SwitchToVariablesEditor, props.id, () => {
        editorTab.value = EditorTabType.Variables
        focusVariablesEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_SwitchToHistory, props.id, () => {
        editorTab.value = EditorTabType.History
        focusHistory()
    })
    keymap.bind(Command.GraphQLConsole_Query_SwitchToSchemaViewer, props.id, () => {
        editorTab.value = EditorTabType.Schema
        focusSchemaEditor()
    })
    keymap.bind(Command.GraphQLConsole_Result_SwitchToRawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        focusRawResultEditor()
    })
    keymap.bind(Command.GraphQLConsole_Result_SwitchToResultVisualizer, props.id, () => {
        resultTab.value = ResultTabType.Visualiser
        focusResultVisualiser()
    })

    focusQueryEditor()
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.GraphQLConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.GraphQLConsole_ShareTab, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_SwitchToQueryEditor, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_SwitchToVariablesEditor, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_SwitchToHistory, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_SwitchToSchemaViewer, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_SwitchToRawResultViewer, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_SwitchToResultVisualizer, props.id)
})

async function executeQuery(): Promise<void> {
    try {
        editorService.addTabHistoryRecord(historyKey.value, createGraphQLConsoleHistoryRecord(queryCode.value, variablesCode.value))
    } catch (e) {
        console.error(e)
        toaster.error(new UnexpectedError(props.params.instancePointer.connection, 'Failed to save query to history.'))
    }

    loading.value = true
    try {
        resultCode.value = await graphQLConsoleService.executeGraphQLQuery(props.params.instancePointer, queryCode.value, JSON.parse(variablesCode.value))
        loading.value = false
        lastAppliedQueryCode.value = queryCode.value

        if (resultTab.value === ResultTabType.Raw) {
            focusRawResultEditor()
        }
    } catch (error: any) {
        loading.value = false
        toaster.error(error)
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

function focusQueryEditor(): void {
    setTimeout(() => queryEditorRef.value?.focus())
}
function focusVariablesEditor(): void {
    setTimeout(() => variablesEditorRef.value?.focus())
}
function focusHistory(): void {
    setTimeout(() => historyRef.value?.focus())
}
function focusSchemaEditor(): void {
    setTimeout(() => schemaEditorRef.value?.focus())
}
function focusRawResultEditor(): void {
    setTimeout(() => rawResultEditorRef.value?.focus())
}
function focusResultVisualiser(): void {
    setTimeout(() => resultVisualiserRef.value?.focus())
}
</script>

<template>
    <div
        v-if="initialized"
        class="graphql-editor"
    >
        <VTabToolbar
            prepend-icon="mdi-graphql"
            :path="path"
        >
            <template #append>
                <LabEditorTabShareButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.GraphQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.instancePointer.connection.preconfigured"
                />

                <VBtn
                    icon
                    density="compact"
                >
                    <VIcon>mdi-information</VIcon>
                    <VTooltip activator="parent">
                        GraphQL API instance details
                    </VTooltip>
                </VBtn>

                <VExecuteQueryButton :loading="loading" @click="executeQuery">
                    <VActionTooltip :command="Command.GraphQLConsole_ExecuteQuery">
                        Execute query
                    </VActionTooltip>
                    Run
                </VExecuteQueryButton>
            </template>
        </VTabToolbar>

        <div class="graphql-editor__body">
            <VSheet class="graphql-editor-query-sections">
                <VSideTabs
                    v-model="editorTab"
                    side="left"
                >
                    <VTab :value="EditorTabType.Query">
                        <VIcon>mdi-database-search</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_SwitchToQueryEditor">
                            Query
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_SwitchToVariablesEditor">
                            Variables
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_SwitchToHistory">
                            History
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Schema">
                        <VIcon>mdi-file-code</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_SwitchToSchemaViewer">
                            Schema
                        </VActionTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>

            <Splitpanes vertical>
                <Pane class="graphql-editor-pane">
                    <VWindow
                        v-model="editorTab"
                        direction="vertical"
                    >
                        <VWindowItem :value="EditorTabType.Query">
                            <VQueryEditor
                                ref="queryEditorRef"
                                v-model="queryCode"
                                :additional-extensions="queryExtensions"
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
                            <LabEditorGraphQLConsoleHistory
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

                <Pane min-size="20" class="graphql-editor-pane">
                    <VWindow
                        v-model="resultTab"
                        direction="vertical"
                    >
                        <VWindowItem :value="ResultTabType.Raw">
                            <VPreviewEditor
                                v-if="resultTab === ResultTabType.Raw"
                                ref="rawResultEditorRef"
                                v-model="resultCode"
                                placeholder="Results will be displayed here..."
                                read-only
                                :additional-extensions="resultExtensions"
                            />
                        </VWindowItem>

                        <VWindowItem v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                            <LabEditorResultVisualiser
                                v-if="resultTab === ResultTabType.Visualiser"
                                ref="resultVisualiserRef"
                                :catalog-pointer="params.instancePointer"
                                :visualiser-service="visualiserService"
                                :input-query="lastAppliedQueryCode || ''"
                                :result="resultCode == undefined || !resultCode ? undefined : JSON.parse(resultCode)"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>
            </Splitpanes>

            <VSheet class="graphql-editor-result-sections">
                <VSideTabs
                    v-model="resultTab"
                    side="right"
                >
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Result_SwitchToRawResultViewer">
                            Raw JSON result
                        </VActionTooltip>
                    </VTab>
                    <VTab v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Result_SwitchToResultVisualizer">
                            Result visualiser
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
}

.graphql-editor-pane {
    & :deep(.v-window) {
        // we need to override the default tab window styles used in LabEditor
        position: absolute;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
    }
}

.graphql-editor-query-sections, .graphql-editor-result-sections {
    display: flex;
    width: 3rem;
}
</style>
