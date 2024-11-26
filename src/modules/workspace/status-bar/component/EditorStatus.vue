<script setup lang="ts">
/**
 * Render the status info of an active editor with info like selection, spaces, and so on.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditorSelection } from '@/modules/workspace/status-bar/model/editor-status/EditorSelection'
import { EditorInfo } from '@/modules/workspace/status-bar/model/editor-status/EditorInfo'
import { EditorStatus } from '@/modules/workspace/status-bar/model/editor-status/EditorStatus'

const { t } = useI18n()

const props = defineProps<{
    status: EditorStatus
}>()

const editorInfo = computed<EditorInfo | undefined>(() =>
    props.status.activatedEditorInfo)

const primarySelection = computed<EditorSelection | undefined>(() => {
    if (editorInfo.value == undefined) {
        return undefined
    }
    if (editorInfo.value.selections.size != 1) {
        return undefined
    }
    return editorInfo.value.selections.get(0)
})

</script>

<template>
    <div v-if="editorInfo" class="editor-status">
        <VTooltip>
            <template #activator="{ props }">
                <span class="text-no-wrap" v-bind="props">
                    <template v-if="editorInfo.selections.size != 1">
                        {{ t('common.statusBar.activeEditorStatus.selections.value.multipleSelections', { count: editorInfo.selections.size }) }}
                    </template>
                    <template v-else>
                        {{ t('common.statusBar.activeEditorStatus.selections.value.singleSelection.cursorPosition', { line: primarySelection!.line, column: primarySelection!.column }) }}
                        <template v-if="primarySelection!.selectedCharacterCount > 0">
                            ({{ t('common.statusBar.activeEditorStatus.selections.value.singleSelection.selectionRange', { charsCount: primarySelection!.selectedCharacterCount }) }}<template v-if="primarySelection!.lineBreaks > 0">, {{ t('common.statusBar.activeEditorStatus.selections.value.singleSelection.lineBreaks', { lineBreaks: primarySelection!.lineBreaks }) }}</template>)
                        </template>
                    </template>
                </span>
            </template>
            <template #default>
                {{ t('common.statusBar.activeEditorStatus.selections.label') }}
            </template>
        </VTooltip>

        <VTooltip>
            <template #activator="{ props }">
                <span class="text-no-wrap" v-bind="props">
                    {{ t('common.statusBar.activeEditorStatus.tabSize.value', { tabSize: editorInfo.tabSize }) }}
                </span>
            </template>
            <template #default>
                {{ t('common.statusBar.activeEditorStatus.tabSize.label') }}
            </template>
        </VTooltip>

        <VTooltip>
            <template #activator="{ props }">
                <span class="text-no-wrap" v-bind="props">
                    {{ editorInfo.language }}
                </span>
            </template>
            <template #default>
                {{ t('common.statusBar.activeEditorStatus.language.label') }}
            </template>
        </VTooltip>
    </div>
</template>

<style lang="scss" scoped>
.editor-status {
    display: flex;
    column-gap: 1rem;
    align-items: center;
}
</style>
