<script setup lang="ts">
/**
 * One-line CodeMirror component with content history support (e.g., for previously executed queries).
 */

import { Codemirror } from 'vue-codemirror'
import { Extension, EditorState } from '@codemirror/state'
import {
    crosshairCursor,
    drawSelection,
    dropCursor,
    highlightSpecialChars, keymap,
    rectangularSelection
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
    bracketMatching,
    defaultHighlightStyle,
    indentOnInput,
    syntaxHighlighting
} from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'
import { dracula } from '@ddietr/codemirror-themes/dracula.js'
import { ViewUpdate } from '@codemirror/view'
import { computed, ref } from 'vue'
import { EditorView } from 'codemirror'

const props = withDefaults(
    defineProps<{
        modelValue: string
        additionalExtensions?: Extension[],
        historyRecords?: string[],
        prependInnerIcon?: string
        placeholder?: string
        disabled?: boolean
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
    (e: 'update:historyClear'): void,
    (e: 'execute'): void
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
    keymap.of([
        {
            key: 'Enter',
            mac: 'Return',
            run: () => {
                emit('execute')
                return true
            }
        },
        {
            key: 'Alt-ArrowDown',
            mac: 'Option-ArrowDown',
            run: () => {
                historyListButton.value?.$el?.click()
                historyListButton.value?.$el?.focus()
                return true
            }
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        ...lintKeymap
    ]),
    dracula,
    EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr),
    ...props.additionalExtensions
]
const editorView = ref<EditorView>()

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
function pickHistoryRecord(selected: unknown[]): void {
    if (selected.length > 0) {
        const historyRecord: string = selected[0] as string
        emit('update:modelValue', historyRecord)
        historyListButton.value?.$el?.click()
        editorView.value?.focus()
    }
}
function clearHistory(): void {
    emit('update:historyClear')
}

function handleEditorUpdate(update: ViewUpdate): void {
    editorView.value = update.view
    emit('update:editor', update)
}
</script>

<template>
    <div :class="['cm-oneline', { 'cm-oneline--with-prepend-icon': prependInnerIcon }]">
        <template v-if="prependInnerIcon">
            <template v-if="historyRecords != undefined">
                <VBtn
                    v-if="prependInnerIcon"
                    ref="historyListButton"
                    icon
                    density="compact"
                    class="cm-oneline__history-list-button"
                >
                    <VIcon
                        v-if="prependInnerIcon"
                        class="cm-oneline__prepend-inner-icon"
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
                    class="cm-oneline__prepend-inner-icon"
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
            :disabled="disabled"
            @update="handleEditorUpdate"
            @update:model-value="$emit('update:modelValue', $event)"
            style="cursor: text; min-width: 0;"
        />
    </div>

</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";

.cm-oneline {
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
