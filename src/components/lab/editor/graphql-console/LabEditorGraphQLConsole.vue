<script setup lang="ts">
/**
 * GraphQL console. Allows to execute GraphQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state'
import { graphql } from 'cm6-graphql'
import { json } from '@codemirror/lang-json'

import { computed, onBeforeMount, ref, watch } from 'vue'
import { GraphQLConsoleService, useGraphQLConsoleService } from '@/services/editor/graphql-console.service'
import { GraphQLSchema, printSchema } from 'graphql'
import { GraphQLConsoleData, GraphQLConsoleParams, GraphQLInstanceType } from '@/model/editor/graphql-console'
import VStandardCodeMirror from '@/components/base/VStandardCodemirror.vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { TabComponentEvents, TabComponentProps } from '@/model/editor/editor'
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import VSideTabs from '@/components/base/VSideTabs.vue'
import LabEditorResultVisualiser
    from '@/components/lab/editor/result-visualiser/LabEditorResultVisualiser.vue'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import {
    useGraphQLResultVisualiserService
} from '@/services/editor/result-visualiser/graphql-result-visualiser.service'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'

import { TabType } from '@/model/editor/tab/tab-type'
import {
    createGraphQLConsoleHistoryKey, createGraphQLConsoleHistoryRecord,
    GraphQLConsoleHistoryKey,
    GraphQLConsoleHistoryRecord
} from '@/model/editor/tab/graphql-console/history'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorGraphQLConsoleHistory from '@/components/lab/editor/graphql-console/LabEditorGraphQLConsoleHistory.vue'
import { UnexpectedError } from '@/model/lab'

enum EditorTabType {
    Query = 'query',
    Variables = 'variables',
    Schema = 'schema',
    History = 'history'
}

enum ResultTabType {
    Raw = 'raw',
    Visualiser = 'visualiser'
}

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

const graphQLSchema = ref<GraphQLSchema>()

const queryCode = ref<string>(props.data?.query ? props.data.query : `# Write your GraphQL query for catalog ${props.params.instancePointer.catalogName} here.\n`)
const queryExtensions: Extension[] = []

const variablesCode = ref<string>(props.data?.variables ? props.data.variables : '{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const schemaEditorInitialized = ref<boolean>(false)
const schemaCode = ref<string>('')
const schemaExtensions: Extension[] = [graphql()]

const historyKey = computed<GraphQLConsoleHistoryKey>(() => createGraphQLConsoleHistoryKey(props.params.instancePointer))
const historyRecords = computed<GraphQLConsoleHistoryRecord[]>(() => {
    return [...editorService.getTabHistoryRecords(historyKey.value)].reverse()
})
function pickHistoryRecord(record: GraphQLConsoleHistoryRecord): void {
    queryCode.value = record[1] || ''
    variablesCode.value = record[2] || ''
    editorTab.value = EditorTabType.Query
}
function clearHistory(): void {
    editorService.clearTabHistory(historyKey.value)
}

const lastAppliedQueryCode = ref<string>('')
const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]

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

                <VExecuteQueryButton :loading="loading" @click="executeQuery" />
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
                        <VTooltip activator="parent">
                            Query
                        </VTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VTooltip activator="parent">
                            Variables
                        </VTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Schema">
                        <VIcon>mdi-file-code</VIcon>
                        <VTooltip activator="parent">
                            Schema
                        </VTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VTooltip activator="parent">
                            History
                        </VTooltip>
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
                            <VStandardCodeMirror
                                v-model="queryCode"
                                :additional-extensions="queryExtensions"
                                @execute="executeQuery"
                            />
                        </VWindowItem>

                        <VWindowItem :value="EditorTabType.Variables">
                            <VStandardCodeMirror
                                v-model="variablesCode"
                                :additional-extensions="variablesExtensions"
                                @execute="executeQuery"
                            />
                        </VWindowItem>

                        <VWindowItem :value="EditorTabType.Schema" @group:selected="initializeSchemaEditor">
                            <VStandardCodeMirror
                                v-model="schemaCode"
                                read-only
                                :additional-extensions="schemaExtensions"
                                style="height: 100%"
                            />
                        </VWindowItem>

                        <VWindowItem :value="EditorTabType.History">
                            <LabEditorGraphQLConsoleHistory
                                :items="historyRecords"
                                @select-history-record="pickHistoryRecord"
                                @update:clear-history="clearHistory"
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
                            <VStandardCodeMirror
                                v-if="resultTab === ResultTabType.Raw"
                                v-model="resultCode"
                                placeholder="Results will be displayed here..."
                                read-only
                                :additional-extensions="resultExtensions"
                            />
                        </VWindowItem>

                        <VWindowItem v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                            <LabEditorResultVisualiser
                                v-if="resultTab === ResultTabType.Visualiser"
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
                        <VTooltip activator="parent">
                            Raw JSON result
                        </VTooltip>
                    </VTab>
                    <VTab v-if="supportsVisualisation" :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VTooltip activator="parent">
                            Result visualiser
                        </VTooltip>
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
