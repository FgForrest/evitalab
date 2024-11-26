<script setup lang="ts">
/**
 * Inline CodeMirror editor with content history support (e.g., for previously executed queries).
 */

import { Codemirror } from 'vue-codemirror'
import { EditorState, Extension } from '@codemirror/state'
import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    highlightSpecialChars,
    keymap as codeMirrorKeymap,
    rectangularSelection,
    ViewUpdate
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'
import { dracula } from '@ddietr/codemirror-themes/dracula.js'
import { computed, ref } from 'vue'
import { EditorView } from 'codemirror'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { Command } from '@/modules/keymap/model/Command'
import { workspaceStatusBarIntegration } from '@/modules/code-editor/extension/workspaceStatusBarIntegration'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'

const keymap: Keymap = useKeymap()
const workspaceService: WorkspaceService = useWorkspaceService()

const props = withDefaults(
    defineProps<{
        modelValue: string
        additionalExtensions?: Extension[],
        historyRecords?: string[],
        prependInnerIcon?: string
        placeholder?: string
    }>(),
    {
        disabled: false,
        additionalExtensions: () => [],
        historyRecords: undefined,
    }
)
const emit = defineEmits<{
    (e: 'update:editor', value: ViewUpdate): void,
    (e: 'update:modelValue', value: string): void,
    (e: 'update:historyClear'): void
}>()

const extensions: Extension[] = [
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    codeMirrorKeymap.of([
        keymap.bindToCodeMirror(Command.InlineQueryEditor_OpenHistory, () => {
            historyListButton.value?.$el?.click()
            historyListButton.value?.$el?.focus()
        }),
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        ...lintKeymap
    ]),
    dracula,
    EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr),
    workspaceStatusBarIntegration(workspaceService),
    ...props.additionalExtensions
]

const editorView = ref<EditorView>()

function handleEditorUpdate(update: ViewUpdate): void {
    editorView.value = update.view
    emit('update:editor', update)
}

/**
 * Focuses the editor.
 */
function focus(): void {
    editorView.value?.focus()
}

const historyListButton = ref<any>()
const hasHistoryItems = computed<boolean>(() => props.historyRecords != undefined && props.historyRecords?.length > 0)
const historyListItems = computed<any[]>(() => {
    if (props.historyRecords?.length === 0) {
        return [{
            title: 'Empty history',
            value: ''
        }]
    }
    return props.historyRecords?.map(record => {
        return {
            title: record.length > 40 ? record.substring(0, 37) + '...' : record,
            value: record
        }
    }) || []
})
function pickHistoryRecord(selected: unknown): void {
    if (selected instanceof Array && selected.length > 0) {
        const historyRecord: string = selected[0] as string
        emit('update:modelValue', historyRecord)
        historyListButton.value?.$el?.click()
        focus()
    }
}
function clearHistory(): void {
    emit('update:historyClear')
}
</script>

<template>
    <div :class="['inline-query-editor', { 'inline-query-editor--with-prepend-icon': prependInnerIcon }]">
        <template v-if="prependInnerIcon">
            <template v-if="historyRecords != undefined">
                <VBtn
                    v-if="prependInnerIcon"
                    ref="historyListButton"
                    icon
                    density="compact"
                    class="inline-query-editor__history-list-button"
                >
                    <VIcon
                        v-if="prependInnerIcon"
                        class="inline-query-editor__prepend-inner-icon"
                    >
                        {{ prependInnerIcon }}
                    </VIcon>

                    <VTooltip activator="parent">
                        Show history
                    </VTooltip>

                    <VMenu activator="parent">
                        <VList
                            density="compact"
                            :items="historyListItems"
                            :disabled="!hasHistoryItems"
                            @update:selected="pickHistoryRecord"
                        />

                        <template v-if="hasHistoryItems">
                            <VDivider/>

                            <VList>
                                <VListItem prepend-icon="mdi-playlist-remove" @click="clearHistory">
                                    Clear
                                </VListItem>
                            </VList>
                        </template>
                    </VMenu>
                </VBtn>
            </template>
            <template v-else>
                <VIcon
                    v-if="prependInnerIcon"
                    class="inline-query-editor__prepend-inner-icon"
                >
                    {{ prependInnerIcon }}
                </VIcon>
            </template>
        </template>

        <Codemirror
            ref="input"
            :model-value="modelValue"
            :extensions="extensions"
            :placeholder="placeholder"
            @update="handleEditorUpdate"
            @update:model-value="$emit('update:modelValue', $event)"
            style="cursor: text; min-width: 0;"
        />
    </div>

</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";

.inline-query-editor {
    display: inline-grid;
    grid-template-columns: 1fr;
    column-gap: 0.25rem;
    align-items: center;

    &--with-prepend-icon {
        grid-template-columns: 1.5rem 1fr;
        gap: 0 0.5rem;
        padding-left: 0.25rem;
    }

    &__prepend-inner-icon {
        opacity: var(--v-medium-emphasis-opacity);
    }

    &__history-list-button {
        padding: 0 !important;
    }

    & :deep(.cm-scroller) {
        overflow-x: hidden;
        background: $primary-dark;
        border-radius: 0.25rem;

        &:focus {
            outline: none;
        }
    }

    & :deep(.cm-editor) {
        background: transparent;
    }
    & :deep(.cm-line) {
        color: white;
        font-weight: bold;
    }

    & :deep(.cm-cursor) {
        border-left: 1px solid #fff;
    }
}
</style>
