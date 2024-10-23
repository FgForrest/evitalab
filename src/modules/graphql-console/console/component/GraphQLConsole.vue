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
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import {
    GraphQLConsoleService,
    useGraphQLConsoleService
} from '@/modules/graphql-console/console/service/GraphQLConsoleService'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import {
    useGraphQLResultVisualiserService
} from '@/modules/graphql-console/console/result-visualiser/service/GraphQLResultVisualiserService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { GraphQLConsoleTabParams } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabParams'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { GraphQLSchema, printSchema } from 'graphql'
import VQueryEditor from '@/modules/code-editor/component/VQueryEditor.vue'
import GraphQLConsoleHistory from '@/modules/graphql-console/console/history/component/GraphQLConsoleHistory.vue'
import {
    createGraphQLConsoleHistoryKey,
    GraphQLConsoleHistoryKey
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryKey'
import {
    createGraphQLConsoleHistoryRecord,
    GraphQLConsoleHistoryRecord
} from '@/modules/graphql-console/console/history/model/GraphQLConsoleHistoryRecord'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import ResultVisualiser from '@/modules/console/result-visualiser/component/ResultVisualiser.vue'
import { Command } from '@/modules/keymap/model/Command'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import VExecuteQueryButton from '@/modules/base/component/VExecuteQueryButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import VSideTabs from '@/modules/base/component/VSideTabs.vue'
import { List } from 'immutable'

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
const workspaceService: WorkspaceService = useWorkspaceService()
const visualiserService: ResultVisualiserService = useGraphQLResultVisualiserService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<GraphQLConsoleTabParams, GraphQLConsoleTabData>>()
const emit = defineEmits<TabComponentEvents>()

const path = ref<string[]>([])
if (props.params.dataPointer.instanceType !== GraphQLInstanceType.System) {
    path.value.push(props.params.dataPointer.catalogName)
}
path.value.push(t(`graphQLConsole.instanceType.${props.params.dataPointer.instanceType}`))
// todo lho fix this workaround, where should we use the immutable list and where array?
const immutablePath = computed(() => List(path.value))
const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

const graphQLSchema = ref<GraphQLSchema>()

const queryEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const queryCode = ref<string>(props.data.query ? props.data.query : t('graphQLConsole.placeholder.writeQuery', { catalogName: props.params.dataPointer.catalogName }))
const queryExtensions: Extension[] = []

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
    emit('dataUpdate', data)
})

onBeforeMount(() => {
    graphQLConsoleService.getGraphQLSchema(props.params.dataPointer)
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
    keymap.bind(Command.GraphQLConsole_Query_QueryEditor, props.id, () => {
        editorTab.value = EditorTabType.Query
        focusQueryEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_VariablesEditor, props.id, () => {
        editorTab.value = EditorTabType.Variables
        focusVariablesEditor()
    })
    keymap.bind(Command.GraphQLConsole_Query_History, props.id, () => {
        editorTab.value = EditorTabType.History
        focusHistory()
    })
    keymap.bind(Command.GraphQLConsole_Query_SchemaViewer, props.id, () => {
        editorTab.value = EditorTabType.Schema
        focusSchemaEditor()
    })
    keymap.bind(Command.GraphQLConsole_Result_RawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        focusRawResultEditor()
    })
    keymap.bind(Command.GraphQLConsole_Result_ResultVisualizer, props.id, () => {
        resultTab.value = ResultTabType.Visualiser
        focusResultVisualiser()
    })

    focusQueryEditor()
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.GraphQLConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.GraphQLConsole_ShareTab, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_QueryEditor, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_VariablesEditor, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_History, props.id)
    keymap.unbind(Command.GraphQLConsole_Query_SchemaViewer, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_RawResultViewer, props.id)
    keymap.unbind(Command.GraphQLConsole_Result_ResultVisualizer, props.id)
})

async function executeQuery(): Promise<void> {
    try {
        workspaceService.addTabHistoryRecord(historyKey.value, createGraphQLConsoleHistoryRecord(queryCode.value, variablesCode.value))
    } catch (e) {
        console.error(e)
        toaster.error(new UnexpectedError(t('graphQLConsole.notification.failedToSaveQueryToHistory')))
    }

    loading.value = true
    try {
        resultCode.value = await graphQLConsoleService.executeGraphQLQuery(props.params.dataPointer, queryCode.value, JSON.parse(variablesCode.value))
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
    <div v-if="initialized" class="graphql-editor">
        <VTabToolbar prepend-icon="mdi-graphql" :path="immutablePath">
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.GraphQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.dataPointer.connection.preconfigured"
                />

                <VBtn
                    icon
                    density="compact"
                >
                    <VIcon>mdi-information-outline</VIcon>
                    <VTooltip activator="parent">
                        <!-- TODO implement -->
                        {{ t('graphQLConsole.button.instanceDetails') }}
                    </VTooltip>
                </VBtn>

                <VExecuteQueryButton :loading="loading" @click="executeQuery">
                    <VActionTooltip :command="Command.GraphQLConsole_ExecuteQuery" />
                    {{ t('common.button.run') }}
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
                        <VActionTooltip :command="Command.GraphQLConsole_Query_QueryEditor" />
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_VariablesEditor" />
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_History" />
                    </VTab>
                    <VTab :value="EditorTabType.Schema">
                        <VIcon>mdi-file-code</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Query_SchemaViewer" />
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

            <VSheet class="graphql-editor-result-sections">
                <VSideTabs
                    v-model="resultTab"
                    side="right"
                >
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Result_RawResultViewer" />
                    </VTab>
                    <VTab v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip :command="Command.GraphQLConsole_Result_ResultVisualizer" />
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
