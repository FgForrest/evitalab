<script setup lang="ts">

import { Extension } from '@codemirror/state'
import VLabDialog from '@/modules/base/component/VLabDialog.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import VCardTitleWithActions from '@/modules/base/component/VCardTitleWithActions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
    defineProps<{
        modelValue: boolean,
        content: string,
        additionalExtensions?: Extension[],
        maxWidth?: string
    }>(),
    {
        additionalExtensions: () => [],
        maxWidth: '75rem'
    }
)
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void,
    (e: 'update:content', value: string): void
}>()
</script>

<template>
    <VLabDialog
        :model-value="modelValue"
        :max-width="maxWidth"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <template #activator="{ props }">
            <slot name="activator" v-bind="{ props }" />
        </template>

        <template #title>
            <slot name="title" />
        </template>

        <template #default>
            <div class="preview-editor-dialog__editor">
                <VPreviewEditor
                    :model-value="content"
                    :additional-extensions="additionalExtensions"
                    @update:model-value="emit('update:content', $event)"
                />
            </div>
        </template>
    </VLabDialog>
</template>

<style lang="scss" scoped>
.preview-editor-dialog__editor {
    position: relative;
    height: calc(100vh - 15rem);
}
</style>
