<script setup lang="ts">
/**
 * EvitaQL console. Allows to execute EvitaQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { EvitaQLConsoleService, useEvitaQLConsoleService } from '@/services/editor/evitaql-console.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
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

import { EditorService, useEditorService } from '@/services/editor/editor.service'
import LabEditorEvitaQLConsoleHistory from '@/components/lab/editor/evitaql-console/LabEditorEvitaQLConsoleHistory.vue'
import { UnexpectedError } from '@/model/lab'
import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import VQueryEditor from '@/components/base/VQueryEditor.vue'
import VPreviewEditor from '@/components/base/VPreviewEditor.vue'
import LabEditorGraphQLConsoleHistory from '@/components/lab/editor/graphql-console/LabEditorGraphQLConsoleHistory.vue'
import { Command } from '@/model/editor/keymap/Command'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { TabComponentProps } from '@/model/editor/tab/TabComponentProps'
import { EvitaQLConsoleParams } from '@/model/editor/tab/evitaQLConsole/EvitaQLConsoleParams'
import { EvitaQLConsoleData } from '@/model/editor/tab/evitaQLConsole/EvitaQLConsoleData'
import { TabComponentEvents } from '@/model/editor/tab/TabComponentEvents'
import {
    createEvitaQLConsoleHistoryKey,
    EvitaQLConsoleHistoryKey
} from '@/model/editor/tab/evitaQLConsole/history/EvitaQLConsoleHistoryKey'
import {
    createEvitaQLConsoleHistoryRecord,
    EvitaQLConsoleHistoryRecord
} from '@/model/editor/tab/evitaQLConsole/history/EvitaQLConsoleHistoryRecord'
import { TabType } from '@/model/editor/tab/TabType'

enum EditorTabType {
    Query = 'query',
    Variables = 'variables',
    History = 'history'
}

enum ResultTabType {
    Raw = 'raw',
    Visualiser = 'visualiser'
}

const keymap: Keymap = useKeymap()
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

const shareTabButtonRef = ref<InstanceType<typeof LabEditorTabShareButton> | undefined>()

const queryEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const queryCode = ref<string>(props.data.query ? props.data.query : `// Write your EvitaQL query for catalog ${props.params.dataPointer.catalogName} here.\n`)
const queryExtensions: Extension[] = [evitaQL()]

const variablesEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const variablesCode = ref<string>(props.data.variables ? props.data.variables : '{\n  \n}')
const variablesExtensions: Extension[] = [json()]

const historyRef = ref<InstanceType<typeof LabEditorGraphQLConsoleHistory> | undefined>()
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
const rawResultEditorRef = ref<InstanceType<typeof VPreviewEditor> | undefined>()
const resultCode = ref<string>('')
const resultExtensions: Extension[] = [json()]

const resultVisualiserRef = ref<InstanceType<typeof LabEditorResultVisualiser> | undefined>()

const loading = ref<boolean>(false)

const currentData = computed<EvitaQLConsoleData>(() => {
    return new EvitaQLConsoleData(queryCode.value, variablesCode.value)
})
watch(currentData, (data) => {
    emit('dataUpdate', data)
})

onMounted(() => {
    // register console specific keyboard shortcuts
    keymap.bind(Command.EvitaQLConsole_ExecuteQuery, props.id, executeQuery)
    keymap.bind(Command.EvitaQLConsole_ShareTab, props.id, () => shareTabButtonRef.value?.share())
    keymap.bind(Command.EvitaQLConsole_Query_SwitchToQueryEditor, props.id, () => {
        editorTab.value = EditorTabType.Query
        focusQueryEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Query_SwitchToVariablesEditor, props.id, () => {
        editorTab.value = EditorTabType.Variables
        focusVariablesEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Query_SwitchToHistory, props.id, () => {
        editorTab.value = EditorTabType.History
        focusHistory()
    })
    keymap.bind(Command.EvitaQLConsole_Result_SwitchToRawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        focusRawResultEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Result_SwitchToResultVisualizer, props.id, () => {
        resultTab.value = ResultTabType.Visualiser
        focusResultVisualiser()
    })

    focusQueryEditor()
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.EvitaQLConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.EvitaQLConsole_ShareTab, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_SwitchToQueryEditor, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_SwitchToVariablesEditor, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_SwitchToHistory, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_SwitchToRawResultViewer, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_SwitchToResultVisualizer, props.id)
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

        if (resultTab.value === ResultTabType.Raw) {
            focusRawResultEditor()
        }
    } catch (error: any) {
        toaster.error(error)
        loading.value = false
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
function focusRawResultEditor(): void {
    setTimeout(() => rawResultEditorRef.value?.focus())
}
function focusResultVisualiser(): void {
    setTimeout(() => resultVisualiserRef.value?.focus())
}

emit('ready')

if (props.params.executeOnOpen) {
    executeQuery()
}
</script>

<template>
    <div class="evitaql-editor">
        <VTabToolbar
            prepend-icon="mdi-variable"
            :path="path"
        >
            <template #append>
                <LabEditorTabShareButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.EvitaQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.dataPointer.connection.preconfigured"
                />

                <VExecuteQueryButton :loading="loading" @click="executeQuery">
                    <VActionTooltip :command="Command.EvitaQLConsole_ExecuteQuery">
                        Execute query
                    </VActionTooltip>
                    Run
                </VExecuteQueryButton>
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
                        <VActionTooltip :command="Command.EvitaQLConsole_Query_SwitchToQueryEditor">
                            Query
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VActionTooltip :command="Command.EvitaQLConsole_Query_SwitchToVariablesEditor">
                            Variables
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip :command="Command.EvitaQLConsole_Query_SwitchToHistory">
                            History
                        </VActionTooltip>
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
                            <LabEditorEvitaQLConsoleHistory
                                ref="historyRef"
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
                            <VPreviewEditor
                                v-if="resultTab === ResultTabType.Raw"
                                ref="rawResultEditorRef"
                                v-model="resultCode"
                                placeholder="Results will be displayed here..."
                                read-only
                                :additional-extensions="resultExtensions"
                            />
                        </VWindowItem>

                        <VWindowItem :value="ResultTabType.Visualiser">
                            <LabEditorResultVisualiser
                                v-if="resultTab === ResultTabType.Visualiser"
                                ref="resultVisualiserRef"
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
                        <VActionTooltip :command="Command.EvitaQLConsole_Result_SwitchToRawResultViewer">
                            Raw JSON result
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip :command="Command.EvitaQLConsole_Result_SwitchToResultVisualizer">
                            Result visualiser
                        </VActionTooltip>
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
