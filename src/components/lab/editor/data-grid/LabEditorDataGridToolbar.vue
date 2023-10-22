<script setup lang="ts">
/**
 * Toolbar for the LabEditorDataGrid component.
 */
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import { computed } from 'vue'

const props = defineProps<{
    path: string[],
    locale: string | undefined,
    loading: boolean
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
}>()

const flags = computed<any>(() => {
    const flags: any[] = []
    if (props.locale) {
        flags.push({
            title: props.locale,
            prependIcon: 'mdi-translate',
        })
    }
    return flags
})

</script>

<template>
    <VTabToolbar
        prepend-icon="mdi-text-box-edit-outline"
        :path="path"
        :flags="flags"
    >
        <template #append>
            <VExecuteQueryButton @click="emit('executeQuery')" />
        </template>

        <template #extension>
            <slot name="query" />
        </template>
    </VTabToolbar>
</template>

<style lang="scss" scoped>

</style>
