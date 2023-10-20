<script setup lang="ts">
/**
 * Selects the desired output format for a cell detail value.
 */

import { EntityPropertyValueDesiredOutputFormat } from '@/model/editor/data-grid'

const formats: any[] = [
    {
        title: 'Auto pretty print',
        value: EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint,
        props: {
            prependIcon: 'mdi-auto-fix'
        }
    },
    {
        title: 'Raw value',
        value: EntityPropertyValueDesiredOutputFormat.Raw,
        props: {
            prependIcon: 'mdi-text'
        }
    },
    {
        title: 'Markdown',
        value: EntityPropertyValueDesiredOutputFormat.Markdown,
        props: {
            prependIcon: 'mdi-language-markdown-outline'
        }
    },
    {
        title: 'JSON',
        value: EntityPropertyValueDesiredOutputFormat.Json,
        props: {
            prependIcon: 'mdi-code-json'
        }
    },
    {
        title: 'XML',
        value: EntityPropertyValueDesiredOutputFormat.Xml,
        props: {
            prependIcon: 'mdi-xml'
        }
    },
    {
        title: 'HTML',
        value: EntityPropertyValueDesiredOutputFormat.Html,
        props: {
            prependIcon: 'mdi-language-html5'
        }
    }
]

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
                    Select output format
                </VTooltip>
            </VBtn>
        </template>
        <VList
            :selected="[modelValue]"
            :items="formats"
            @update:selected="emit('update:modelValue', $event[0] as EntityPropertyValueDesiredOutputFormat)"
        />
    </VMenu>
</template>

<style lang="scss" scoped>

</style>
