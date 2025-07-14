<script setup lang="ts">

import VActionTooltip from '@/modules/base/component/VActionTooltip.vue'
import { useI18n } from 'vue-i18n'
import { SelectedLayer } from '@/modules/entity-viewer/viewer/model/SelectedLayer.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

const { t } = useI18n()

const emit = defineEmits<{
    (e: 'update:selected', value: SelectedLayer[]): void
}>()

const liveSelection = ref<boolean>(true)
const archiveSelection = ref<boolean>(false)

function updatedSelection():void {
    emit('update:selected', [
        {
            scope: EntityScope.Live,
            value: liveSelection.value,
        },
        {
            scope: EntityScope.Archive,
            value: archiveSelection.value,
        }
    ])
}

</script>

<template>
    <VBtn
        icon
        density="comfortable">
        <VIcon>mdi-layers-search</VIcon>
        <VActionTooltip />

        <VMenu activator="parent">
            <VList>
                <VListItem>
                    <div>
                        <VCheckbox label="Live" v-model="liveSelection" @update:model-value="updatedSelection" hide-details>
                        </VCheckbox>
                        <VTooltip activator="parent">{{ t('entityViewer.layerSelector.live') }}</VTooltip>
                    </div>
                </VListItem>
                <VListItem>
                    <div>
                        <VCheckbox label="Archive" v-model="archiveSelection" @update:model-value="updatedSelection" hide-details>
                        </VCheckbox>
                        <VTooltip activator="parent">{{ t('entityViewer.layerSelector.archive') }}</VTooltip>
                    </div>
                </VListItem>
            </VList>
        </VMenu>
    </VBtn>
</template>

<style scoped lang="scss">

</style>
