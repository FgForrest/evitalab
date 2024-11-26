<script setup lang="ts">
/**
 * Read-only CodeMirror editor to preview texts.
 */

import { Codemirror } from 'vue-codemirror'
import { EditorState, Extension } from '@codemirror/state'
import { basicSetup, EditorView } from 'codemirror'
import { dracula } from '@ddietr/codemirror-themes/dracula.js'
import { ref } from 'vue'
import { ViewUpdate } from '@codemirror/view'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { workspaceStatusBarIntegration } from '@/modules/code-editor/extension/workspaceStatusBarIntegration'

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
    basicSetup,
    dracula,
    EditorState.readOnly.of(true),
    workspaceStatusBarIntegration(workspaceService),
    ...props.additionalExtensions
]

const editorView = ref<EditorView>()

function handleEditorUpdate(update: ViewUpdate): void {
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
    <div :class="['preview-editor']">
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
.preview-editor {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
}
</style>
