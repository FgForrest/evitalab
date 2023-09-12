<script setup lang="ts">

import { Codemirror } from 'vue-codemirror'
import { EditorState, Extension } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { materialDark } from 'cm6-theme-material-dark'

const props = withDefaults(
    defineProps<{
        modelValue: string
        additionalExtensions?: Extension[]
        placeholder?: string
        readOnly?: boolean,
        disabled?: boolean
    }>(),
    {
        readOnly: false,
        disabled: false,
        additionalExtensions: () => []
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void,
    (e: 'execute'): void
}>()

const extensions: Extension[] = [
    keymap.of([
        {
            key: 'Ctrl-Enter',
            run: () => {
                emit('execute')
                return true
            }
        }
    ]),
    basicSetup,
    materialDark,
    ...props.additionalExtensions
]
if (props.readOnly) {
    extensions.push(EditorState.readOnly.of(true))
}
</script>

<template>
    <div class="cm-full">
        <Codemirror
            :model-value="modelValue"
            :extensions="extensions"
            :placeholder="placeholder"
            :disabled="disabled"
            @update:model-value="$emit('update:modelValue', $event)"
            style="height: 100%; cursor: text;"
        />
    </div>
</template>

<style lang="scss" scoped>
// we need that the codemirror will stretch to the full size of the parent
.cm-full {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
}
</style>
