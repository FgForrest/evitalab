<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import VPreviewEditorDialog from '@/modules/code-editor/component/VPreviewEditorDialog.vue'

const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    exception: string
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
    <VPreviewEditorDialog
        :model-value="modelValue"
        :content="exception"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            {{ t('taskViewer.tasksVisualizer.task.exception.title') }}
        </template>
    </VPreviewEditorDialog>
</template>

<style lang="scss" scoped>
</style>
