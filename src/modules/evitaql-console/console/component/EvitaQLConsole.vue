<script setup lang="ts">
import { asError } from '@/utils/error'
/**
 * EvitaQL console. Allows to execute EvitaQL queries against a evitaDB instance.
 */

import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import type { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import {
    EvitaQLConsoleService,
    useEvitaQLConsoleService
} from '@/modules/evitaql-console/console/service/EvitaQLConsoleService'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import type { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import {
    useEvitaQLResultVisualiserService
} from '@/modules/evitaql-console/console/result-visualiser/service/EvitaQLResultVisualiserService'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'
import type { TabComponentEvents } from '@/modules/workspace/tab/model/TabComponentEvents'
import { EvitaQLConsoleTabParams } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabParams'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import VQueryEditor from '@/modules/code-editor/component/VQueryEditor.vue'
import { evitaQL } from '@lukashornych/codemirror-lang-evitaql'
import EvitaQLConsoleHistory from '@/modules/evitaql-console/console/history/component/EvitaQLConsoleHistory.vue'
import {
    createEvitaQLConsoleHistoryKey
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryKey'
import type { EvitaQLConsoleHistoryKey } from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryKey'
import {
    createEvitaQLConsoleHistoryRecord
} from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord'
import type { EvitaQLConsoleHistoryRecord } from '@/modules/evitaql-console/console/history/model/EvitaQLConsoleHistoryRecord'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import ResultVisualiser from '@/modules/console/result-visualiser/component/ResultVisualiser.vue'
import { Command } from '@/modules/keymap/model/Command'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import VExecuteQueryButton from '@/modules/base/component/VExecuteQueryButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import VSideTabs from '@/modules/base/component/VSideTabs.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'
import { List } from 'immutable'
import type { TabComponentExpose } from '@/modules/workspace/tab/model/TabComponentExpose'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import {
    ConnectionSubjectPath
} from '@/modules/connection/workspace/status-bar/model/subject-path-status/ConnectionSubjectPath'
import { SubjectPathItem } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPathItem'
import {
    EvitaQLConsoleTabDefinition
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDefinition'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'

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
defineExpose<TabComponentExpose>({
    path(): SubjectPath | undefined {
        return new ConnectionSubjectPath(
            props.params.dataPointer.connection,
            [SubjectPathItem.significant(
                EvitaQLConsoleTabDefinition.icon(),
                props.params.dataPointer.catalogName
            )]
        )
    }
})

const title: List<string> = List.of(props.params.dataPointer.catalogName)
const editorTab = ref<EditorTabType>(EditorTabType.Query)
const resultTab = ref<ResultTabType>(ResultTabType.Raw)

const queryPanelVisible = ref<boolean>(true)
const resultPanelVisible = ref<boolean>(props.params.executeOnOpen)
const bothPanelsHidden = computed<boolean>(() => !queryPanelVisible.value && !resultPanelVisible.value)
/**
 * The result panel starts hidden so that a fresh console offers the full width to the query, and opens
 * itself when the first result arrives. Any later execution respects whatever the user chose since.
 */
let firstResultPending: boolean = true

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
    queryPanelVisible.value = true
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
const result = ref<EvitaResponse>()
const resultExtensions: Extension[] = [json()]

const resultVisualiserRef = ref<
    InstanceType<typeof ResultVisualiser> | undefined
>()

const loading = ref<boolean>(false)

const currentData = computed<EvitaQLConsoleTabData>(() => {
    return new EvitaQLConsoleTabData(queryCode.value, variablesCode.value)
})
watch(currentData, (data) => {
    emit('update:data', data)
})

onMounted(() => {
    // register console specific keyboard shortcuts
    keymap.bind(Command.EvitaQLConsole_ExecuteQuery, props.id, executeQuery)
    keymap.bind(Command.EvitaQLConsole_ShareTab, props.id, () =>
        shareTabButtonRef.value?.share()
    )
    keymap.bind(Command.EvitaQLConsole_Query_QueryEditor, props.id, () => {
        editorTab.value = EditorTabType.Query
        queryPanelVisible.value = true
        focusQueryEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Query_VariablesEditor, props.id, () => {
        editorTab.value = EditorTabType.Variables
        queryPanelVisible.value = true
        focusVariablesEditor()
    })
    keymap.bind(Command.EvitaQLConsole_Query_History, props.id, () => {
        editorTab.value = EditorTabType.History
        queryPanelVisible.value = true
        focusHistory()
    })
    keymap.bind(Command.EvitaQLConsole_Query_TogglePanel, props.id, () => {
        queryPanelVisible.value = !queryPanelVisible.value
    })
    keymap.bind(Command.EvitaQLConsole_Result_RawResultViewer, props.id, () => {
        resultTab.value = ResultTabType.Raw
        resultPanelVisible.value = true
        focusRawResultEditor()
    })
    keymap.bind(
        Command.EvitaQLConsole_Result_ResultVisualizer,
        props.id,
        () => {
            resultTab.value = ResultTabType.Visualiser
            resultPanelVisible.value = true
            focusResultVisualiser()
        }
    )
    keymap.bind(Command.EvitaQLConsole_Result_TogglePanel, props.id, () => {
        resultPanelVisible.value = !resultPanelVisible.value
    })

    focusQueryEditor()
})
onUnmounted(() => {
    // unregister console specific keyboard shortcuts
    keymap.unbind(Command.EvitaQLConsole_ExecuteQuery, props.id)
    keymap.unbind(Command.EvitaQLConsole_ShareTab, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_QueryEditor, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_VariablesEditor, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_History, props.id)
    keymap.unbind(Command.EvitaQLConsole_Query_TogglePanel, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_RawResultViewer, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_ResultVisualizer, props.id)
    keymap.unbind(Command.EvitaQLConsole_Result_TogglePanel, props.id)
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
        await toaster.error(
            t('evitaQLConsole.notification.failedToSaveQueryToHistory'),
            asError(e)
        )
    }

    loading.value = true
    try {
        result.value = await evitaQLConsoleService.executeEvitaQLQuery(
            props.params.dataPointer,
            queryCode.value,
            // JSON.parse(variablesCode.value) // todo lho support
        )
        loading.value = false
        enteredQueryCode.value = queryCode.value

        if (firstResultPending) {
            firstResultPending = false
            resultPanelVisible.value = true
        }

        if (resultTab.value === ResultTabType.Raw) {
            focusRawResultEditor()
        }
    } catch (error) {
        await toaster.error('Could not execute query', asError(error)) // todo lho i18n
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
        <VTabToolbar :prepend-icon="EvitaQLConsoleTabDefinition.icon()" :title="title">
            <template #append>
                <ShareTabButton
                    ref="shareTabButtonRef"
                    :tab-type="TabType.EvitaQLConsole"
                    :tab-params="params"
                    :tab-data="currentData"
                    :command="Command.EvitaQLConsole_ShareTab"
                />

                <VExecuteQueryButton
                    :command="Command.EvitaQLConsole_ExecuteQuery"
                    :loading="loading"
                    :title="t('common.button.run')"
                    @click="executeQuery"
                    >
                </VExecuteQueryButton>
            </template>
        </VTabToolbar>

        <div class="evitaql-editor__body">
            <VSheet class="evitaql-editor-query-sections">
                <VSideTabs
                    v-model="editorTab"
                    v-model:visible="queryPanelVisible"
                    side="left"
                    collapsible
                >
                    <VTab :value="EditorTabType.Query">
                        <VIcon>mdi-database-search</VIcon>
                        <VActionTooltip
                            :command="Command.EvitaQLConsole_Query_QueryEditor"
                        >
                            {{ t('evitaQLConsole.tooltip.queryEditorView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.Variables">
                        <VIcon>mdi-variable</VIcon>
                        <VActionTooltip
                            :command="
                                Command.EvitaQLConsole_Query_VariablesEditor
                            "
                        >
                            {{ t('evitaQLConsole.tooltip.variablesEditorView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="EditorTabType.History">
                        <VIcon>mdi-history</VIcon>
                        <VActionTooltip
                            :command="Command.EvitaQLConsole_Query_History"
                        >
                            {{ t('evitaQLConsole.tooltip.historyView') }}
                        </VActionTooltip>
                    </VTab>
                </VSideTabs>
            </VSheet>

            <div class="evitaql-editor__panes-area">
                <Splitpanes
                    vertical
                    :class="[
                        'evitaql-editor__panes',
                        { 'evitaql-editor__panes--collapsed': !queryPanelVisible || !resultPanelVisible }
                    ]"
                >
                    <Pane
                        :class="[
                            'evitaql-editor-pane',
                            { 'evitaql-editor-pane--hidden': !queryPanelVisible },
                            { 'evitaql-editor-pane--full': queryPanelVisible && !resultPanelVisible }
                        ]"
                    >
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

                    <Pane
                        min-size="20"
                        :class="[
                            'evitaql-editor-pane',
                            { 'evitaql-editor-pane--hidden': !resultPanelVisible },
                            { 'evitaql-editor-pane--full': resultPanelVisible && !queryPanelVisible }
                        ]"
                    >
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

                <VMissingDataIndicator
                    v-if="bothPanelsHidden"
                    class="evitaql-editor__no-panels"
                    icon="mdi-arrow-expand-horizontal"
                    :title="t('evitaQLConsole.placeholder.noPanelsVisible')"
                >
                    <template #actions>
                        <VBtn variant="outlined" @click="queryPanelVisible = true">
                            {{ t('evitaQLConsole.button.showQueryPanel') }}
                        </VBtn>
                        <VBtn variant="outlined" @click="resultPanelVisible = true">
                            {{ t('evitaQLConsole.button.showResultPanel') }}
                        </VBtn>
                    </template>
                </VMissingDataIndicator>
            </div>

            <VSheet class="evitaql-editor-result-sections">
                <VSideTabs
                    v-model="resultTab"
                    v-model:visible="resultPanelVisible"
                    side="right"
                    collapsible
                >
                    <VTab :value="ResultTabType.Raw">
                        <VIcon>mdi-code-braces</VIcon>
                        <VActionTooltip
                            :command="
                                Command.EvitaQLConsole_Result_RawResultViewer
                            "
                        >
                            {{ t('evitaQLConsole.tooltip.rawResultViewerView') }}
                        </VActionTooltip>
                    </VTab>
                    <VTab :value="ResultTabType.Visualiser">
                        <VIcon>mdi-file-tree-outline</VIcon>
                        <VActionTooltip
                            :command="
                                Command.EvitaQLConsole_Result_ResultVisualizer
                            "
                        >
                            {{ t('evitaQLConsole.tooltip.resultVisualizerView') }}
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

.evitaql-editor-pane {
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

.evitaql-editor-query-sections,
.evitaql-editor-result-sections {
    display: flex;
    width: 3rem;
}
</style>
