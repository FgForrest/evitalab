<script setup lang="ts">
/**
 * Toolbar for the LabEditorDataGrid component.
 */
import { useI18n } from 'vue-i18n'
import { Keymap, useKeymap } from '@/modules/keymap/service/Keymap'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ShareTabButton from '@/modules/workspace/tab/component/ShareTabButton.vue'
import { Command } from '@/modules/keymap/model/Command'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import VExecuteQueryButton from '@/modules/base/component/VExecuteQueryButton.vue'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { useDataLocale, useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'
import { List } from 'immutable'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

const props = defineProps<{
    currentData: EntityViewerTabData,
    path: List<string>,
    loading: boolean
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
}>()
const tabProps = useTabProps()
const dataLocale = useDataLocale()

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

const shareTabButtonRef = ref<InstanceType<typeof ShareTabButton> | undefined>()

onMounted(() => {
    // register grid specific keyboard shortcuts
    keymap.bind(Command.EntityViewer_ShareTab, tabProps.id, () => shareTabButtonRef.value?.share())
})
onUnmounted(() => {
    // unregister grid specific keyboard shortcuts
    keymap.unbind(Command.EntityViewer_ShareTab, tabProps.id)
})
</script>

<template>
    <VTabToolbar
        prepend-icon="mdi-text-box-edit-outline"
        :path="path"
        :flags="flags"
    >
        <template #append>
            <ShareTabButton
                ref="shareTabButtonRef"
                :tab-type="TabType.EntityViewer"
                :tab-params="tabProps.params"
                :tab-data="currentData"
                :disabled="!tabProps.params.dataPointer.connection.preconfigured"
            />

            <VExecuteQueryButton :loading="loading" @click="emit('executeQuery')">
                <VActionTooltip :command="Command.EntityViewer_ExecuteQuery" />
                {{ t('common.button.run') }}
            </VExecuteQueryButton>
        </template>

        <template #extension>
            <slot name="query" />
        </template>
    </VTabToolbar>
</template>

<style lang="scss" scoped>

</style>
