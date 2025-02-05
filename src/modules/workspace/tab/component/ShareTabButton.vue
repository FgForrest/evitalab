<script setup lang="ts">
/**
 * Universal button to share the current tab and its data with other users via a link pointing to the same evitaLab
 * instance.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import ShareTabDialog from '@/modules/workspace/tab/component/ShareTabDialog.vue'
import { Command } from '@/modules/keymap/model/Command'
import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    tabType: TabType,
    tabParams: TabParams<any>,
    tabData: TabData<any> | undefined,
    disabled?: boolean
    command: Command
}>(), {
    disabled: false
})

const shareDialogOpen = ref<boolean>(false)

function share() {
    shareDialogOpen.value = true
}

defineExpose<{
    share: () => void
}>({
    share
})
</script>

<template>
    <ShareTabDialog
        v-model="shareDialogOpen"
        :tab-type="props.tabType"
        :tab-params="props.tabParams"
        :tab-data="props.tabData"
    >
        <template #activator="{ props }">
            <VBtn
                icon
                density="compact"
                v-bind="props"
                :disabled="disabled"
                @click="shareDialogOpen = true"
            >
                <VIcon>mdi-share-variant</VIcon>
                <VActionTooltip activator="parent" :command="command">
                    <template v-if="disabled">
                        {{ t('tabShare.tooltip.nonSharableTab') }}
                    </template>
                    <template v-else>
                        {{ t('tabShare.button.shareTab') }}
                    </template>
                </VActionTooltip>
            </VBtn>
        </template>
    </ShareTabDialog>
</template>

<style lang="scss" scoped>

</style>
