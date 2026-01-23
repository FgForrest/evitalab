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
import { useDataLocale, useTabProps, useLayer } from '@/modules/entity-viewer/viewer/component/dependencies'
import { List } from 'immutable'
import { EntityScope, EntityScopeIcons } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { getEnumKeyByValue } from '@/utils/enum.ts'

const keymap: Keymap = useKeymap()
const { t } = useI18n()

defineProps<{
    icon: string,
    currentData: EntityViewerTabData,
    title: List<string>,
    loading: boolean,
}>()
const emit = defineEmits<{
    (e: 'executeQuery'): void
}>()
const tabProps = useTabProps()
const dataLocale = useDataLocale()
const layers = useLayer()

interface ToolbarFlag {
    title: string
    prependIcon: string
}

const flags = computed<ToolbarFlag[]>(() => {
    const flags: ToolbarFlag[] = []
    if (dataLocale?.value != undefined) {
        flags.push({
            title: dataLocale.value,
            prependIcon: 'mdi-translate',
        })
    }
    if(layers.value != undefined) {
        for (const val of layers.value) {
            if(val.value) {
                flags.push({
                    title: t(`command.entityViewer.toolbar.${getEnumKeyByValue(EntityScope, val.scope).toLowerCase()}`),
                    prependIcon: EntityScopeIcons[val.scope]
                })
            }
        }
    }
    return flags
})

type ShareTabButtonType = InstanceType<typeof ShareTabButton> | undefined
const shareTabButtonRef = ref<ShareTabButtonType>()

onMounted(() => {
    // register grid specific keyboard shortcuts
    keymap.bind(Command.EntityViewer_ShareTab, tabProps.id, () => { shareTabButtonRef.value?.share() })
})
onUnmounted(() => {
    // unregister grid specific keyboard shortcuts
    keymap.unbind(Command.EntityViewer_ShareTab, tabProps.id)
})
</script>

<template>
    <VTabToolbar
        :prepend-icon="icon"
        :title="title"
        :flags="flags"
    >
        <template #append>
            <ShareTabButton
                ref="shareTabButtonRef"
                :tab-type="TabType.EntityViewer"
                :tab-params="tabProps.params"
                :tab-data="currentData"
                :command="Command.EntityViewer_ShareTab"
            />

            <VExecuteQueryButton :command="Command.EntityViewer_ExecuteQuery" :loading="loading" :title="t('common.button.run')" @click="emit('executeQuery')">
            </VExecuteQueryButton>
        </template>

        <template #extension>
            <slot name="query" />
        </template>
    </VTabToolbar>
</template>

<style lang="scss" scoped>

</style>
