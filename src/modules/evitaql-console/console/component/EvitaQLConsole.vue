<script setup lang="ts">
/**
 * EvitaQL console. Allows to execute EvitaQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import {
    EvitaQLConsoleService,
    useEvitaQLConsoleService,
} from '@/modules/evitaql-console/console/service/EvitaQLConsoleService'
import {
    useWorkspaceService,
    WorkspaceService,
} from '@/modules/workspace/service/WorkspaceService'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { useEvitaQLResultVisualiserService } from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { EvitaQLConsoleTabParams } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabParams'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import VQueryEditor from '@/modules/code-editor/component/VQueryEditor.vue'
import { evitaQL } from '@lukashornych/codemirror-lang-evitaql'
import EvitaQLConsoleHistory from '@/modules/evitaql-console/console/history/component/EvitaQLConsoleHistory.vue'
import {
    createEvitaQLConsoleHistoryKey,
    EvitaQLConsoleHistoryKey,
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryKey'
import {
    createEvitaQLConsoleHistoryRecord,
    EvitaQLConsoleHistoryRecord,
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord'
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
import { Response } from '@/modules/connection/model/data/Response'

enum EditorTabType {
    Query = 'query',
    Variables = 'variables',
    History = 'history',
}

enum ResultTabType {
    Raw = 'raw',
    Visualiser = 'visualiser',
}

const keymap: Keymap = useKeymap()
const evitaQLConsoleService: EvitaQLConsoleService = useEvitaQLConsoleService()
const workspaceService: WorkspaceService = useWorkspaceService()
const visualiserService: ResultVisualiserService =
    useEvitaQLResultVisualiserService()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props =
    defineProps<
        TabComponentProps<EvitaQLConsoleTabParams, EvitaQLConsoleTabData>
    >()
const emit = defineEmits<TabComponentEvents>()

const path = List([props.params.dataPointer.catalogName])
const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

const queryEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const queryCode = ref<string>(
    props.data.query
        ? props.data.query
        : t('evitaQLConsole.placeholder.writeQuery', {
              catalogName: props.params.dataPointer.catalogName,
          })
)
const queryExtensions: Extension[] = [evitaQL()]

const variablesEditorRef = ref<InstanceType<typeof VQueryEditor> | undefined>()
const variablesCode = ref<string>(
    props.data.variables ? props.data.variables : '{\n  \n}'
)
const variablesExtensions: Extension[] = [json()]

const historyRef = ref<InstanceType<typeof EvitaQLConsoleHistory> | undefined>()
const historyKey = computed<EvitaQLConsoleHistoryKey>(() =>
    createEvitaQLConsoleHistoryKey(props.params.dataPointer)
)
const historyRecords = computed<EvitaQLConsoleHistoryRecord[]>(() => {
    return [
        ...workspaceService.getTabHistoryRecords(historyKey.value),
    ].reverse()
})
function pickHistoryRecord(record: EvitaQLConsoleHistoryRecord): void {
    queryCode.value = record[1] || ''
    variablesCode.value = record[2] || ''
    editorTab.value = EditorTabType.Query
}
function clearHistory(): void {
    workspaceService.clearTabHistory(historyKey.value)
}

const enteredQueryCode = ref<string>('')
const rawResult = computed<string>(() => {
    if (result.value == undefined) {
        return ''
    }
    return JSON.stringify(JSON.parse(result.value!.rawResponse), null, 2)
})
const rawResultEditorRef = ref<
    InstanceType<typeof VPreviewEditor> | undefined
>()
const result = ref<Response>()
const resultExtensions: Extension[] = [json()]

const resultVisualiserRef = ref<
    InstanceType<typeof ResultVisualiser> | undefined
>()

const loading = ref<boolean>(false)

const currentData = computed<EvitaQLConsoleTabData>(() => {
    return new EvitaQLConsoleTabData(queryCode.value, variablesCode.value)
})
watch(currentData, (data) => {
    emit('dataUpdate', data)
})

onMounted(() => {
    // register console specific keyboard shortcuts
    keymap.bind(Command.EvitaQLConsole_ExecuteQuery, props.id, executeQuery)
    keymap.bind(Command.EvitaQLConsole_ShareTab, props.id, () =>
        shareTabButtonRef.value?.share()
    )
    keymap.bind(Command.EvitaQLConsole_Query_QueryEditor, props.id, () => {
        editorTab.value = EditorTabType.Query
        focusQueryEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Query_VariablesEditor, props.id, () => {
        editorTab.value = EditorTabType.Variables
        focusVariablesEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Query_History, props.id, () => {
        editorTab.value = EditorTabType.History
        focusHistory()
    })
    keymap.bind(Command.EvitaQLConsole_Result_RawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        focusRawResultEditor()
    })
    keymap.bind(
        Command.EvitaQLConsole_Result_ResultVisualizer,
        props.id,
        () => {
            resultTab.value = ResultTabType.Visualiser
            focusResultVisualiser()
        }
    )

    focusQueryEditor()
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.EvitaQLConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.EvitaQLConsole_ShareTab, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_QueryEditor, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_VariablesEditor, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_History, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_RawResultViewer, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_ResultVisualizer, props.id)
})

async function executeQuery(): Promise<void> {
    try {
        workspaceService.addTabHistoryRecord(
            historyKey.value,
            createEvitaQLConsoleHistoryRecord(
                queryCode.value,
                variablesCode.value
            )
        )
    } catch (e) {
        console.error(e)
        toaster.error(
            new UnexpectedError(
                t('evitaQLConsole.notification.failedToSaveQueryToHistory')
            )
        )
    }

    loading.value = true
    try {
        result.value = await evitaQLConsoleService.executeEvitaQLQuery(
            props.params.dataPointer,
            queryCode.value,
            JSON.parse(variablesCode.value)
        )
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
        <VTabToolbar prepend-icon="mdi-variable" :path="path">
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.EvitaQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :disabled="!params.dataPointer.connection.preconfigured"
                />

                <VExecuteQueryButton :loading="loading" @click="executeQuery">
                    <VActionTooltip
                        :command="Command.EvitaQLConsole_ExecuteQuery"
                    />
                    {{ t('common.button.run') }}
                </VExecuteQueryButton>
            </template>
        </VTabToolbar>

        <div class="evitaql-editor__body">
            <VSheet class="evitaql-editor-query-sections">
                <VSideTabs v-model="editorTab" side="left">
                    <VTab :value="EditorTabType.Query">
                        <VIcon>mdi-database-search</VIcon>
                        <VActionTooltip
                            :command="Command.EvitaQLConsole_Query_QueryEditor"
                        />
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VActionTooltip
                            :command="
                                Command.EvitaQLConsole_Query_VariablesEditor
                            "
                        />
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip
                            :command="Command.EvitaQLConsole_Query_History"
                        />
                    </VTab>
                </VSideTabs>
            </VSheet>

            <Splitpanes vertical>
                <Pane class="evitaql-editor-pane">
                    <VWindow v-model="editorTab" direction="vertical">
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
                            <EvitaQLConsoleHistory
                                ref="historyRef"
                                :items="historyRecords"
                                @select-history-record="pickHistoryRecord"
                                @update:clear-history="clearHistory"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>

                <Pane min-size="20" class="evitaql-editor-pane">
                    <VWindow v-model="resultTab" direction="vertical">
                        <VWindowItem :value="ResultTabType.Raw">
                            <VPreviewEditor
                                v-if="resultTab === ResultTabType.Raw"
                                ref="rawResultEditorRef"
                                :model-value="rawResult"
                                :placeholder="
                                    t('evitaQLConsole.placeholder.results')
                                "
                                read-only
                                :additional-extensions="resultExtensions"
                            />
                        </VWindowItem>

                        <VWindowItem :value="ResultTabType.Visualiser">
                            <ResultVisualiser
                                v-if="resultTab === ResultTabType.Visualiser"
                                ref="resultVisualiserRef"
                                :catalog-pointer="params.dataPointer"
                                :visualiser-service="visualiserService"
                                :input-query="enteredQueryCode || ''"
                                :result="result"
                            />
                        </VWindowItem>
                    </VWindow>
                </Pane>
            </Splitpanes>

            <VSheet class="evitaql-editor-result-sections">
                <VSideTabs v-model="resultTab" side="right">
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
                        <VActionTooltip
                            :command="
                                Command.EvitaQLConsole_Result_RawResultViewer
                            "
                        />
                    </VTab>
                    <VTab :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip
                            :command="
                                Command.EvitaQLConsole_Result_ResultVisualizer
                            "
                        />
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

.evitaql-editor-query-sections,
.evitaql-editor-result-sections {
    display: flex;
    width: 3rem;
}
</style>
