<script setup lang="ts">

import { Codemirror } from 'vue-codemirror'
import { EditorState, Extension } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { dracula } from '@ddietr/codemirror-themes/dracula.js'
import { ref } from 'vue'
import CodemirrorFullStatusBar from '@/components/base/CodemirrorFullStatusBar.vue'

const props = withDefaults(
    defineProps<{
        modelValue: string
        additionalExtensions?: Extension[]
        placeholder?: string
        readOnly?: boolean,
        disabled?: boolean,
        statusBar?: boolean
    }>(),
    {
        readOnly: false,
        disabled: false,
        statusBar: true,
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
    dracula,
    ...props.additionalExtensions
]
if (props.readOnly) {
    extensions.push(EditorState.readOnly.of(true))
}

const state = ref<EditorState>()
</script>

<template>
    <div :class="['cm-full', { 'cm-full--with-status-bar': statusBar }]">
        <Codemirror
            :model-value="modelValue"
            :extensions="extensions"
            :placeholder="placeholder"
            :disabled="disabled"
            @update="state = $event.state"
            @update:model-value="$emit('update:modelValue', $event)"
            style="height: 100%; cursor: text;"
        />
        <VSheet v-if="statusBar" class="status-bar">
            <CodemirrorFullStatusBar :state="state" />
        </VSheet>
    </div>
</template>

<style lang="scss" scoped>
// we need that the codemirror will stretch to the full size of the parent
.cm-full {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 2rem;
}

.status-bar {
    display: flex;
    justify-content: right;
}
</style>
