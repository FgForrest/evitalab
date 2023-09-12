<script setup lang="ts">

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

const props = withDefaults(
    defineProps<{
        modelValue: string
        additionalExtensions?: Extension[]
        prependInnerIcon?: string
        placeholder?: string
        disabled?: boolean
    }>(),
    {
        disabled: false,
        additionalExtensions: () => []
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void,
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
            run: () => {
                emit('execute')
                return true
            }
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        ...lintKeymap
    ]),
    EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr),
    ...props.additionalExtensions
]
</script>

<template>
    <div :class="['cm-oneline', { 'cm-oneline--with-prepend-icon': prependInnerIcon }]">
        <VIcon
            v-if="prependInnerIcon"
            class="cm-oneline__prepend-inner-icon"
        >
            {{ prependInnerIcon }}
        </VIcon>

        <Codemirror
            :model-value="modelValue"
            :extensions="extensions"
            :placeholder="placeholder"
            :disabled="disabled"
            @update:model-value="$emit('update:modelValue', $event)"
            style="cursor: text; min-width: 0;"
        />
    </div>

</template>

<style lang="scss" scoped>
.cm-oneline {
    height: 2.75rem;
    display: inline-grid;
    grid-template-columns: 1fr;
    padding: 0 1rem;
    column-gap: 0.25rem;
    align-items: center;

    &--with-prepend-icon {
        grid-template-columns: 1.5rem 1fr;
        padding: 0 1rem 0 0.625rem;
    }

    &__prepend-inner-icon {
        opacity: var(--v-medium-emphasis-opacity);
    }

    & :deep(.cm-scroller) {
      overflow-x: hidden;
    }
}
</style>
