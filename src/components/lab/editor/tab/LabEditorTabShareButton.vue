<script setup lang="ts">
/**
 * Universal button to share the current tab and its data with other users via a link pointing to the same evitaLab
 * instance.
 */
import {
    SerializableTabRequestComponentData, SerializableTabRequestComponentParams,
} from '@/model/editor/editor'
import { ref } from 'vue'
import LabEditorTabShareDialog from '@/components/lab/editor/tab/LabEditorTabShareDialog.vue'

import { TabType } from '@/model/editor/tab/tab-type'

const props = withDefaults(defineProps<{
    tabType: TabType,
    tabParams: SerializableTabRequestComponentParams<any>,
    tabData: SerializableTabRequestComponentData<any> | undefined,
    disabled?: boolean
}>(), {
    disabled: false
})

const shareDialogOpen = ref<boolean>(false)
</script>

<template>
    <LabEditorTabShareDialog
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
                <VTooltip activator="parent">
                    <template v-if="disabled">
                        Cannot share this tab because it is using a user-defined evitaDB connection. Only pre-configured
                        connections can be shared.
                    </template>
                    <template v-else>
                        Share this tab
                    </template>
                </VTooltip>
            </VBtn>
        </template>
    </LabEditorTabShareDialog>
</template>

<style lang="scss" scoped>

</style>
