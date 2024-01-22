<script setup lang="ts">
/**
 * Toolbar for the LabEditorDataGrid component.
 */
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import { computed, inject } from 'vue'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'
import { DataGridData, gridParamsKey } from '@/model/editor/data-grid'
import { dataLocaleKey } from '@/model/editor/data-grid'
import { mandatoryInject } from '@/helpers/reactivity'

import { TabType } from '@/model/editor/tab/tab-type'

const props = defineProps<{
    currentData: DataGridData,
    path: string[],
    loading: boolean
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
}>()
const gridParams = mandatoryInject(gridParamsKey)
const dataLocale = inject(dataLocaleKey)

const flags = computed<any>(() => {
    const flags: any[] = []
    if (dataLocale?.value != undefined) {
        flags.push({
            title: dataLocale.value,
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
            <LabEditorTabShareButton
                :tab-type="TabType.DataGrid"
                :tab-params="gridParams"
                :tab-data="currentData"
                :disabled="!gridParams.dataPointer.connection.preconfigured"
            />

            <VExecuteQueryButton :loading="loading" @click="emit('executeQuery')" />
        </template>

        <template #extension>
            <slot name="query" />
        </template>
    </VTabToolbar>
</template>

<style lang="scss" scoped>

</style>
