<script setup lang="ts">
/**
 * CodeMirror editor for editing queries and related data.
 */

import { Codemirror } from 'vue-codemirror'
import { EditorState } from '@codemirror/state'
import type { Extension } from 'node_modules/@codemirror/state/dist/index.d.cts'
import { keymap, ViewUpdate } from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { dracula } from '@ddietr/codemirror-themes/dracula'
import { computed, ref, watch } from 'vue'
import { workspaceStatusBarIntegration } from '@/modules/code-editor/extension/workspaceStatusBarIntegration'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { v4 as uuidv4 } from 'uuid'

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

defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const extensions = computed<Extension[]>(() => [
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
])

// used to forcefully reload codemirror component as it doesn't reload
// automatically when props change
const codemirrorInstanceKey = ref<string>()
watch(
    () => props.additionalExtensions,
    () => codemirrorInstanceKey.value = uuidv4()
)

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
            :key="codemirrorInstanceKey"
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
