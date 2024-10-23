<script setup lang="ts">
/**
 * Render detailed info about the current text selection.
 */

import { Line, SelectionRange, Text } from '@codemirror/state'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
    doc: Text,
    selectionRange: SelectionRange
}>()

const headLine = computed<Line>(() => {
    return props.doc.lineAt(props.selectionRange.head)
})
const anchorLine = computed<Line>(() => {
    return props.doc.lineAt(props.selectionRange.anchor)
})

const headPositionInLine = computed<number>(() => {
    return props.selectionRange.head - headLine.value.from + 1
})
const selectedCharsCount = computed<number>(() => {
    if (props.selectionRange.empty) {
        return 0
    }
    return Math.abs(props.selectionRange.anchor - props.selectionRange.head)
})
const selectedLinesCount = computed<number>(() => {
    if (props.selectionRange.empty) {
        return 0
    }
    return Math.abs(anchorLine.value.number - headLine.value.number)
})
</script>

<template>
    <span class="text-no-wrap">
        {{ t('common.codeEditor.status.cursorPosition', { line: headLine.number, column: headPositionInLine }) }}
        <template v-if="!selectionRange.empty">
            ({{ t('common.codeEditor.status.selectionRange', { charsCount: selectedCharsCount }) }}<template v-if="selectedLinesCount">, {{ t('common.codeEditor.status.selectionRanges', { linesCount: selectedLinesCount }) }}</template>)
        </template>
    </span>
</template>

<style lang="scss" scoped>

</style>
