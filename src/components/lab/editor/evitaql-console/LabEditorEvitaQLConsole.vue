<script setup lang="ts">
/**
 * EvitaQL console. Allows to execute EvitaQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'

import { computed, ref, watch } from 'vue'
import VStandardCodeMirror from '@/components/base/VStandardCodemirror.vue'
import { EvitaQLConsoleService, useEvitaQLConsoleService } from '@/services/editor/evitaql-console.service'
import { EvitaQLConsoleData, EvitaQLConsoleParams } from '@/model/editor/evitaql-console'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { TabComponentEvents, TabComponentProps } from '@/model/editor/editor'
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import VSideTabs from '@/components/base/VSideTabs.vue'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import {
    useEvitaQLResultVisualiserService
} from '@/services/editor/result-visualiser/evitaql-result-visualiser.service'
import LabEditorResultVisualiser from '@/components/lab/editor/result-visualiser/LabEditorResultVisualiser.vue'
import { evitaQL } from '@lukashornych/codemirror-lang-evitaql'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'

import { TabType } from '@/model/editor/tab/tab-type'
import {
    createEvitaQLConsoleHistoryKey, createEvitaQLConsoleHistoryRecord,
    EvitaQLConsoleHistoryKey,
    EvitaQLConsoleHistoryRecord
} from '@/model/editor/tab/evitaql-console/history'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorEvitaQLConsoleHistory from '@/components/lab/editor/evitaql-console/LabEditorEvitaQLConsoleHistory.vue'
import { UnexpectedError } from '@/model/lab'

enum EditorTabType {
    Query = 'query',
    Variables = 'variables',
    History = 'history'
}

enum ResultTabType {
    Raw = 'raw',
    Visualiser = 'visualiser'
}

const evitaQLConsoleService: EvitaQLConsoleService = useEvitaQLConsoleService()
const editorService: EditorService = useEditorService()
const visualiserService: ResultVisualiserService = useEvitaQLResultVisualiserService()
const toaster: Toaster = useToaster()

const props = defineProps<TabComponentProps<EvitaQLConsoleParams, EvitaQLConsoleData>>()
const emit = defineEmits<TabComponentEvents>()

const path = ref<string[]>([
    props.params.dataPointer.catalogName
])
const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const queryCode = ref<string>(props.data?.query ? props.data.query : `// Write your EvitaQL query for catalog ${props.params.dataPointer.catalogName} here.\n`)
const queryExtensions: Extension[] = [evitaQL()]

const variablesCode = ref<string>(props.data?.variables ? props.data.variables : '{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const historyKey = computed<EvitaQLConsoleHistoryKey>(() => createEvitaQLConsoleHistoryKey(props.params.dataPointer))
const historyRecords = computed<EvitaQLConsoleHistoryRecord[]>(() => {
    return [...editorService.getTabHistoryRecords(historyKey.value)].reverse()
})
function pickHistoryRecord(record: EvitaQLConsoleHistoryRecord): void {
    queryCode.value = record[1] || ''
    variablesCode.value = record[2] || ''
    editorTab.value = EditorTabType.Query
}
function clearHistory(): void {
    editorService.clearTabHistory(historyKey.value)
}

const enteredQueryCode = ref<string>('')
const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]

const loading = ref<boolean>(false)

const currentData = computed<EvitaQLConsoleData>(() => {
    return new EvitaQLConsoleData(queryCode.value, variablesCode.value)
})
watch(currentData, (data) => {
    emit('dataUpdate', data)
})

async function executeQuery(): Promise<void> {
    try {
        editorService.addTabHistoryRecord(historyKey.value, createEvitaQLConsoleHistoryRecord(queryCode.value, variablesCode.value))
    } catch (e) {
        console.error(e)
        toaster.error(new UnexpectedError(props.params.dataPointer.connection, 'Failed to save query to history.'))
    }

    loading.value = true
    try {
        resultCode.value = await evitaQLConsoleService.executeEvitaQLQuery(props.params.dataPointer, queryCode.value, JSON.parse(variablesCode.value))
        loading.value = false
        enteredQueryCode.value = queryCode.value
    } catch (error: any) {
        toaster.error(error)
        loading.value = false
    }
}

emit('ready')

if (props.params.executeOnOpen) {
    executeQuery()
}
</script>

<template>
    <div class="evitaql-editor">
        <VTabToolbar
            prepend-icon="mdi-application-braces-outline"
            :path="path"
        >
            <template #append>
                <LabEditorTabShareButton
                    :tab-type="TabType.EvitaQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.dataPointer.connection.preconfigured"
                />

                <VExecuteQueryButton :loading="loading" @click="executeQuery" />
            </template>
        </VTabToolbar>

        <div class="evitaql-editor__body">
            <VSheet class="evitaql-editor-query-sections">
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
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VTooltip activator="parent">
                            History
                        </VTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>

            <Splitpanes vertical>
                <Pane class="evitaql-editor-pane">
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

                        <VWindowItem :value="EditorTabType.History">
                            <LabEditorEvitaQLConsoleHistory
                                :items="historyRecords"
                                @select-history-record="pickHistoryRecord"
                                @update:clear-history="clearHistory"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>

                <Pane min-size="20" class="evitaql-editor-pane">
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

                        <VWindowItem :value="ResultTabType.Visualiser">
                            <LabEditorResultVisualiser
                                v-if="resultTab === ResultTabType.Visualiser"
                                :catalog-pointer="params.dataPointer"
                                :visualiser-service="visualiserService"
                                :input-query="enteredQueryCode || ''"
                                :result="resultCode == undefined || !resultCode ? undefined : JSON.parse(resultCode)"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>
            </Splitpanes>

            <VSheet class="evitaql-editor-result-sections">
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
                    <VTab :value="ResultTabType.Visualiser">
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
.evitaql-editor {
    display: grid;
    grid-template-rows: 3rem 1fr;

    &__body {
        display: grid;
        grid-template-columns: 3rem 1fr 3rem;
    }
}

.evitaql-editor-pane {
    & :deep(.v-window) {
        // we need to override the default tab window styles used in LabEditor
        position: absolute;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
    }
}

.evitaql-editor-query-sections, .evitaql-editor-result-sections {
    display: flex;
    width: 3rem;
}
</style>
