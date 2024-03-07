<script setup lang="ts">
/**
 * Toolbar for the LabEditorDataGrid component.
 */
import VExecuteQueryButton from '@/components/base/VExecuteQueryButton.vue'
import VTabToolbar from '@/components/base/VTabToolbar.vue'
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import LabEditorTabShareButton from '@/components/lab/editor/tab/LabEditorTabShareButton.vue'
import { mandatoryInject } from '@/helpers/reactivity'

import { Keymap, useKeymap } from '@/model/editor/keymap/Keymap'
import { Command } from '@/model/editor/keymap/Command'
import VActionTooltip from '@/components/base/VActionTooltip.vue'
import { DataGridData, dataLocaleKey, gridPropsKey } from '@/model/editor/tab/dataGrid/data-grid'
import { TabType } from '@/model/editor/tab/TabType'

const keymap: Keymap = useKeymap()

const props = defineProps<{
    currentData: DataGridData,
    path: string[],
    loading: boolean
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
}>()
const gridProps = mandatoryInject(gridPropsKey)
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

const shareTabButtonRef = ref<InstanceType<typeof LabEditorTabShareButton> | undefined>()

onMounted(() => {
    // register grid specific keyboard shortcuts
    keymap.bind(Command.EntityGrid_ShareTab, gridProps.id, () => shareTabButtonRef.value?.share())
})
onUnmounted(() => {
    // unregister grid specific keyboard shortcuts
    keymap.unbind(Command.EntityGrid_ShareTab, gridProps.id)
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
                ref="shareTabButtonRef"
                :tab-type="TabType.DataGrid"
                :tab-params="gridProps.params"
                :tab-data="currentData"
                :disabled="!gridProps.params.dataPointer.connection.preconfigured"
            />

            <VExecuteQueryButton :loading="loading" @click="emit('executeQuery')">
                <!-- todo this should reference grid specific command-->
                <VActionTooltip :command="Command.EntityGrid_ExecuteQuery">
                    Execute query
                </VActionTooltip>
                Run
            </VExecuteQueryButton>
        </template>

        <template #extension>
            <slot name="query" />
        </template>
    </VTabToolbar>
</template>

<style lang="scss" scoped>

</style>
