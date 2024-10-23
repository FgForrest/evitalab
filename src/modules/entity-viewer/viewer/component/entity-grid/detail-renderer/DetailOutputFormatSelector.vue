<script setup lang="ts">
/**
 * Selects the desired output format for a cell detail value.
 */

import { useI18n } from 'vue-i18n'
import {
    EntityPropertyValueDesiredOutputFormat
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueDesiredOutputFormat'

const { t } = useI18n()

const props = defineProps<{
    modelValue: EntityPropertyValueDesiredOutputFormat
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: EntityPropertyValueDesiredOutputFormat): void
}>()
</script>

<template>
    <VMenu>
        <template #activator="{ props }">
            <VBtn
                icon
                variant="text"
                density="compact"
                v-bind="props"
            >
                <VIcon>mdi-code-braces</VIcon>
                <VTooltip activator="parent">
                    {{ t('entityViewer.grid.renderer.button.selectOutputFormat') }}
                </VTooltip>
            </VBtn>
        </template>
        <VList
            :selected="[modelValue]"
            @update:selected="emit('update:modelValue', $event[0] as EntityPropertyValueDesiredOutputFormat)"
        >
            <VListItem :value="EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint" prepend-icon="mdi-auto-fix">
                {{ t(`entityViewer.grid.renderer.format.${EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint}`) }}
            </VListItem>
            <VListItem :value="EntityPropertyValueDesiredOutputFormat.Raw" prepend-icon="mdi-text">
                {{ t(`entityViewer.grid.renderer.format.${EntityPropertyValueDesiredOutputFormat.Raw}`) }}
            </VListItem>
            <VListItem :value="EntityPropertyValueDesiredOutputFormat.Markdown" prepend-icon="mdi-language-markdown-outline">
                {{ t(`entityViewer.grid.renderer.format.${EntityPropertyValueDesiredOutputFormat.Markdown}`) }}
            </VListItem>
            <VListItem :value="EntityPropertyValueDesiredOutputFormat.Json" prepend-icon="mdi-code-json">
                {{ t(`entityViewer.grid.renderer.format.${EntityPropertyValueDesiredOutputFormat.Json}`) }}
            </VListItem>
            <VListItem :value="EntityPropertyValueDesiredOutputFormat.Xml" prepend-icon="mdi-xml">
                {{ t(`entityViewer.grid.renderer.format.${EntityPropertyValueDesiredOutputFormat.Xml}`) }}
            </VListItem>
            <VListItem :value="EntityPropertyValueDesiredOutputFormat.Html" prepend-icon="mdi-language-html5">
                {{ t(`entityViewer.grid.renderer.format.${EntityPropertyValueDesiredOutputFormat.Html}`) }}
            </VListItem>
        </VList>
    </VMenu>
</template>

<style lang="scss" scoped>

</style>
