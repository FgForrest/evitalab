<script setup lang="ts">
/**
 * REST console. Allows to execute REST queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'

import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import VQueryEditor from '@/modules/code-editor/component/VQueryEditor.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import ResultVisualiser from '@/modules/console/result-visualiser/component/ResultVisualiser.vue'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import VExecuteQueryButton from '@/modules/base/component/VExecuteQueryButton.vue'
import VSideTabs from '@/modules/base/component/VSideTabs.vue'
import Immutable, { List } from 'immutable'
import { RestConsoleService, useRestConsoleService } from '@/modules/rest-console/console/service/RestConsoleService'
import { RestConsoleTabParams } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParams'
import { RestConsoleTabData } from '@/modules/rest-console/console/workspace/model/RestConsoleTabData'
import { acceptsRequestBody, RestOperationType } from '@/modules/rest-console/console/model/RestOperationType'
import { VCombobox } from 'vuetify/components'

enum EditorTabType {
    Query = 'query',
    // todo lho impl
    // History = 'history',
    Schema = 'schema'
}

enum ResultTabType {
    Raw = 'raw',
    // todo lho impl
    // Visualiser = 'visualiser'
}

const keymap: Keymap = useKeymap()
const restConsoleService: RestConsoleService = useRestConsoleService()
const workspaceService: WorkspaceService = useWorkspaceService()
// todo lho impl
// const visualiserService: ResultVisualiserService = useRestResultVisualiserService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<TabComponentProps<RestConsoleTabParams, RestConsoleTabData>>()
const emit = defineEmits<TabComponentEvents>()

// todo lho support system api
const path = ref<string[]>([props.params.dataPointer.catalogName])
// todo lho fix this workaround, where should we use the immutable list and where array?
const immutablePath = computed(() => List(path.value))
const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

const openApiSchema = ref<object>()

const collections = ref<string[]>([])
const selectedCollection = ref<string | undefined>(props.data.entityType != undefined ? props.data.entityType : undefined)
const operations = ref<RestOperationType[]>([
    RestOperationType.Get,
    RestOperationType.List,
    RestOperationType.Query,
    RestOperationType.Delete,
    RestOperationType.Schema
])
const selectedOperation = ref<RestOperationType | undefined>(props.data.operation != undefined ? props.data.operation : undefined)

const queryEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const queryCode = ref<string>(props.data.query ? props.data.query : '{\n\t\n}')
const enableQueryEditor = computed<boolean>(() => {
    if (selectedOperation.value == undefined) {
        return false
    }
    return acceptsRequestBody(selectedOperation.value)
})
const queryExtensions: Extension[] = []

// todo lho impl
// const historyRef = ref<InstanceType<typeof GraphQLConsoleHistory> | undefined>()
// const historyKey = computed<GraphQLConsoleHistoryKey>(() => createGraphQLConsoleHistoryKey(props.params.dataPointer))
// const historyRecords = computed<GraphQLConsoleHistoryRecord[]>(() => {
//     return [...workspaceService.getTabHistoryRecords(historyKey.value)].reverse()
// })
// function pickHistoryRecord(record: GraphQLConsoleHistoryRecord): void {
//     queryCode.value = record[1] || ''
//     variablesCode.value = record[2] || ''
//     editorTab.value = EditorTabType.Query
//     setTimeout(() => queryEditorRef.value?.focus())
// }
// function clearHistory(): void {
//     workspaceService.clearTabHistory(historyKey.value)
// }

const schemaEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const schemaEditorInitialized = ref<boolean>(false)
const schemaCode = ref<object | undefined>()
const schemaExtensions: Extension[] = [json()]

const lastAppliedQueryCode = ref<string>('')
const rawResultEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const resultCode = ref<object | undefined>()
const previewableResultCode = computed<string>(() => {
    if (resultCode.value == undefined) {
        return ''
    }
    return JSON.stringify(resultCode.value, null, 2)
})
const resultExtensions: Extension[] = [json()]

const resultVisualiserRef = ref<InstanceType<typeof ResultVisualiser> | undefined>()
const supportsVisualisation = computed<boolean>(() => {
    // todo lho impl
    return false
    // return props.params.dataPointer.instanceType === GraphQLInstanceType.Data
})

const loading = ref<boolean>(false)
const initialized = ref<boolean>(false)

const currentData = computed<RestConsoleTabData>(() => {
    return new RestConsoleTabData(
        selectedCollection.value,
        selectedOperation.value,
        queryCode.value
    )
})
watch(currentData, (data) => {
    emit('dataUpdate', data)
})

onBeforeMount(() => {
    restConsoleService.getOpenAPISchema(props.params.dataPointer)
        .then(schema => {
            openApiSchema.value = schema
            return restConsoleService.getCollections(props.params.dataPointer)
        })
        .then(resolvedCollections => {
            collections.value = resolvedCollections.toArray()

            // todo ruzito: impl `rest` plugin
            queryExtensions.push(json()) // temporary
            // queryExtensions.push(rest(schema)) // wanted

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
    // todo lho impl
    // keymap.bind(Command.GraphQLConsole_ExecuteQuery, props.id, executeQuery)
    // keymap.bind(Command.GraphQLConsole_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    // keymap.bind(Command.GraphQLConsole_Query_QueryEditor, props.id, () => {
    //     editorTab.value = EditorTabType.Query
    //     focusQueryEditor()
    // })
    // keymap.bind(Command.GraphQLConsole_Query_VariablesEditor, props.id, () => {
    //     editorTab.value = EditorTabType.Variables
    //     focusVariablesEditor()
    // })
    // keymap.bind(Command.GraphQLConsole_Query_History, props.id, () => {
    //     editorTab.value = EditorTabType.History
    //     focusHistory()
    // })
    // keymap.bind(Command.GraphQLConsole_Query_SchemaViewer, props.id, () => {
    //     editorTab.value = EditorTabType.Schema
    //     focusSchemaEditor()
    // })
    // keymap.bind(Command.GraphQLConsole_Result_RawResultViewer, props.id, () => {
    //     resultTab.value = ResultTabType.Raw
    //     focusRawResultEditor()
    // })
    // keymap.bind(Command.GraphQLConsole_Result_ResultVisualizer, props.id, () => {
    //     resultTab.value = ResultTabType.Visualiser
    //     focusResultVisualiser()
    // })

    focusQueryEditor()
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    // todo lho impl
    // keymap.unbind(Command.GraphQLConsole_ExecuteQuery, props.id)
    // keymap.unbind(Command.GraphQLConsole_ShareTab, props.id)
    // keymap.unbind(Command.GraphQLConsole_Query_QueryEditor, props.id)
    // keymap.unbind(Command.GraphQLConsole_Query_VariablesEditor, props.id)
    // keymap.unbind(Command.GraphQLConsole_Query_History, props.id)
    // keymap.unbind(Command.GraphQLConsole_Query_SchemaViewer, props.id)
    // keymap.unbind(Command.GraphQLConsole_Result_RawResultViewer, props.id)
    // keymap.unbind(Command.GraphQLConsole_Result_ResultVisualizer, props.id)
})

async function executeQuery(): Promise<void> {
    // todo lho impl
    // try {
    //     workspaceService.addTabHistoryRecord(historyKey.value, createGraphQLConsoleHistoryRecord(queryCode.value, variablesCode.value))
    // } catch (e) {
    //     console.error(e)
    //     toaster.error(new UnexpectedError(t('graphQLConsole.notification.failedToSaveQueryToHistory')))
    // }

    loading.value = true
    try {
        // todo lho impl
        // todo lho forbid execution if operation or entity type is null
        resultCode.value = await restConsoleService.executeRestQuery(
            props.params.dataPointer,
            undefined, // todo lho impl
            selectedCollection.value,
            selectedOperation.value,
            undefined,
            queryCode.value,
        )
        loading.value = false
        lastAppliedQueryCode.value = queryCode.value

        if (resultTab.value === ResultTabType.Raw) {
            // todo lho impl
            // focusRawResultEditor()
        }
    } catch (error: any) {
        loading.value = false
        toaster.error(error)
    }
}

function initializeSchemaEditor(): void {
    if (!schemaEditorInitialized.value) {
        if (openApiSchema.value) {
            schemaCode.value = openApiSchema.value
            schemaEditorInitialized.value = true
        } else {
            schemaCode.value = undefined
        }
    }
}

function focusQueryEditor(): void {
    setTimeout(() => queryEditorRef.value?.focus())
}
// todo lho impl
// function focusVariablesEditor(): void {
//     setTimeout(() => variablesEditorRef.value?.focus())
// }
// function focusHistory(): void {
//     setTimeout(() => historyRef.value?.focus())
// }
// function focusSchemaEditor(): void {
//     setTimeout(() => schemaEditorRef.value?.focus())
// }
// function focusRawResultEditor(): void {
//     setTimeout(() => rawResultEditorRef.value?.focus())
// }
// function focusResultVisualiser(): void {
//     setTimeout(() => resultVisualiserRef.value?.focus())
// }
</script>

<template>
    <div
        v-if="initialized"
        class="rest-editor"
    >
        <VTabToolbar
            prepend-icon="mdi-api"
            :path="immutablePath"
        >
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.RestConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.dataPointer.connection.preconfigured"
                />

                <VBtn
                    icon
                    density="compact"
                >
                    <VIcon>mdi-information</VIcon>
                    <VTooltip activator="parent">
                        <!-- TODO implement -->
                        {{ t('restConsole.button.instanceDetails') }}
                    </VTooltip>
                </VBtn>

                <VExecuteQueryButton :loading="loading" @click="executeQuery">
<!--                    todo lho impl -->
<!--                    <VActionTooltip :command="Command.GraphQLConsole_ExecuteQuery" />-->
                    {{ t('common.button.run') }}
                </VExecuteQueryButton>
            </template>
        </VTabToolbar>

        <div class="rest-editor__body">
            <VSheet class="rest-editor-query-sections">
                <VSideTabs
                    v-model="editorTab"
                    side="left"
                >
                    <VTab :value="EditorTabType.Query">
                        <VIcon>mdi-database-search</VIcon>
<!-- todo lho impl-->
                        <!--                        <VActionTooltip :command="Command.GraphQLConsole_Query_QueryEditor" />-->
                    </VTab>
<!--                    <VTab :value="EditorTabType.History">-->
<!--                        <VIcon>mdi-history</VIcon>-->
<!--&lt;!&ndash; todo lho impl&ndash;&gt;-->
<!--                        &lt;!&ndash;                        <VActionTooltip :command="Command.GraphQLConsole_Query_History" />&ndash;&gt;-->
<!--                    </VTab>-->
                    <VTab :value="EditorTabType.Schema">
                        <VIcon>mdi-file-code</VIcon>
<!-- todo lho impl-->
                        <!--                        <VActionTooltip :command="Command.GraphQLConsole_Query_SchemaViewer" />-->
                    </VTab>
                </VSideTabs>
            </VSheet>

            <Splitpanes vertical>
                <Pane class="rest-editor-pane">
                    <VWindow
                        v-model="editorTab"
                        direction="vertical"
                    >
                        <VWindowItem :value="EditorTabType.Query">
                            <div class="rest-query">
<!--                                todo lho impl combobox-->
                                <VSelect
                                    ref="collectionsRef"
                                    v-model="selectedCollection"
                                    :disabled="collections != undefined && collections.size == 0"
                                    prepend-inner-icon="mdi-list-box-outline"
                                    :label="t('restConsole.editor.label.collection')"
                                    :items="collections"
                                    hide-details
                                />
                                <VSelect
                                    ref="operationsRef"
                                    v-model="selectedOperation"
                                    :disabled="selectedCollection == undefined"
                                    prepend-inner-icon="mdi-format-list-bulleted-type"
                                    :label="t('restConsole.editor.label.operation')"
                                    :items="operations"
                                    :return-object="false"
                                    hide-details
                                />

                                <div style="position: relative">
<!--                                    todo lho better-->
                                    <VQueryEditor
                                        v-if="enableQueryEditor"
                                        ref="queryEditorRef"
                                        v-model="queryCode"
                                        :additional-extensions="queryExtensions"
                                    />
<!--                                   todo lho params editor -->
                                </div>
                            </div>
                        </VWindowItem>

<!--                        <VWindowItem :value="EditorTabType.History">-->
<!--&lt;!&ndash; todo lho impl &ndash;&gt;-->
<!--                            &lt;!&ndash;                            <GraphQLConsoleHistory&ndash;&gt;-->
<!--&lt;!&ndash;                                ref="historyRef"&ndash;&gt;-->
<!--&lt;!&ndash;                                :items="historyRecords"&ndash;&gt;-->
<!--&lt;!&ndash;                                @select-history-record="pickHistoryRecord"&ndash;&gt;-->
<!--&lt;!&ndash;                                @update:clear-history="clearHistory"&ndash;&gt;-->
<!--&lt;!&ndash;                            />&ndash;&gt;-->
<!--                        </VWindowItem>-->

                        <VWindowItem :value="EditorTabType.Schema" @group:selected="initializeSchemaEditor">
                            <VPreviewEditor
                                ref="schemaEditorRef"
                                :model-value="JSON.stringify(schemaCode, null, 2)"
                                :additional-extensions="schemaExtensions"
                                style="height: 100%"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>

                <Pane min-size="20" class="rest-editor-pane">
                    <VWindow
                        v-model="resultTab"
                        direction="vertical"
                    >
                        <VWindowItem :value="ResultTabType.Raw">
                            <VPreviewEditor
                                v-if="resultTab === ResultTabType.Raw"
                                ref="rawResultEditorRef"
                                :model-value="previewableResultCode"
                                :placeholder="t('restConsole.placeholder.results')"
                                read-only
                                :additional-extensions="resultExtensions"
                            />
                        </VWindowItem>

<!--                        todo lho impl-->
<!--                        <VWindowItem v-if="supportsVisualisation" :value="ResultTabType.Visualiser">-->
<!--                            <ResultVisualiser-->
<!--                                v-if="resultTab === ResultTabType.Visualiser"-->
<!--                                ref="resultVisualiserRef"-->
<!--                                :catalog-pointer="params.dataPointer"-->
<!--                                :visualiser-service="visualiserService"-->
<!--                                :input-query="lastAppliedQueryCode || ''"-->
<!--                                :result="resultCode == undefined || !resultCode ? undefined : resultCode"-->
<!--                            />-->
<!--                        </VWindowItem>-->
                    </VWindow>
                </Pane>
            </Splitpanes>

            <VSheet class="rest-editor-result-sections">
                <VSideTabs
                    v-model="resultTab"
                    side="right"
                >
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
<!-- todo lho impl -->
                        <!--                        <VActionTooltip :command="Command.GraphQLConsole_Result_RawResultViewer" />-->
                    </VTab>
<!--                    <VTab v-if="supportsVisualisation" :value="ResultTabType.Visualiser">-->
<!--                        <VIcon>mdi-file-tree-outline</VIcon>-->
<!--&lt;!&ndash; todo lho impl &ndash;&gt;-->
<!--                        &lt;!&ndash;                        <VActionTooltip :command="Command.GraphQLConsole_Result_ResultVisualizer" />&ndash;&gt;-->
<!--                    </VTab>-->
                </VSideTabs>
            </VSheet>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.rest-editor {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        display: grid;
        grid-template-columns: 3rem 1fr 3rem;
    }
}

.rest-query {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: grid;
    grid-template-rows: 3rem 3rem 1fr;
}

.rest-editor-pane {
    & :deep(.v-window) {
        // we need to override the default tab window styles used in LabEditor
        position: absolute;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
    }
}

.rest-editor-query-sections, .rest-editor-result-sections {
    display: flex;
    width: 3rem;
}
</style>
