<script setup lang="ts">
/**
 * CodeMirror editor for editing queries and related data.
 */

import { Codemirror } from 'vue-codemirror'
import { EditorState, Extension } from '@codemirror/state'
import { keymap, ViewUpdate } from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { dracula } from '@ddietr/codemirror-themes/dracula.js'
import { ref } from 'vue'
import { workspaceStatusBarIntegration } from '@/modules/code-editor/extension/workspaceStatusBarIntegration'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'

const workspaceService: WorkspaceService = useWorkspaceService()

const props = withDefaults(
    defineProps<{
        modelValue: string
        additionalExtensions?: Extension[]
        placeholder?: string
    }>(),
    {
        additionalExtensions: () => []
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const extensions: Extension[] = [
    keymap.of([
        // let consoles use this keybinding for custom action without creating new lines
        {
            key: 'Ctrl-Enter',
            mac: 'Cmd-Enter',
            run: () => true
        }
    ]),
    basicSetup,
    dracula,
    workspaceStatusBarIntegration(workspaceService),
    ...props.additionalExtensions
]

const editorState = ref<EditorState>()
const editorView = ref<EditorView>()

function handleEditorUpdate(update: ViewUpdate): void {
    editorState.value = update.state
    editorView.value = update.view
}

/**
 * Focuses the editor.
 */
function focus(): void {
    editorView.value?.focus()
}

defineExpose<{
    focus: () => void
}>({
    focus
})
</script>

<template>
    <div :class="['query-editor']">
        <Codemirror
            :model-value="modelValue"
            :extensions="extensions"
            :placeholder="placeholder"
            @update="handleEditorUpdate"
            @update:model-value="$emit('update:modelValue', $event)"
            style="height: 100%; cursor: text;"
        />
    </div>
</template>

<style lang="scss" scoped>
// we need that the codemirror will stretch to the full size of the parent
.query-editor {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
}
</style>
