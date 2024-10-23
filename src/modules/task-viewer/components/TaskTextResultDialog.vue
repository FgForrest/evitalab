<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import VPreviewEditorDialog from '@/modules/code-editor/component/VPreviewEditorDialog.vue'
import { TextTaskResult } from '@/modules/connection/model/task/TextTaskResult'

const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    result: TextTaskResult
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
    <VPreviewEditorDialog
        :model-value="modelValue"
        :content="result.value"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('taskViewer.tasksVisualizer.task.textResult.title') }}
        </template>
    </VPreviewEditorDialog>
</template>

<style lang="scss" scoped>
</style>
