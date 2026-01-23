<script setup lang="ts">

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { SelectedScope } from '@/modules/entity-viewer/viewer/model/SelectedScope.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

const { t } = useI18n()

const props = defineProps<{
    selectedScope: SelectedScope[]
}>()

const emit = defineEmits<{
    (e: 'update:selected', value: SelectedScope[]): void
}>()

const liveSelection = ref<boolean>(props.selectedScope.find(x => x.scope === EntityScope.Live)?.value ?? false)
const archiveSelection = ref<boolean>(props.selectedScope.find(x => x.scope === EntityScope.Archive)?.value ?? false)

watch(liveSelection, () => {
    updatedSelection()
})

watch(archiveSelection, () => {
    updatedSelection()
})

function updatedSelection(): void {
    emit('update:selected', [
        {
            scope: EntityScope.Live,
            value: liveSelection.value
        },
        {
            scope: EntityScope.Archive,
            value: archiveSelection.value
        }
    ])
}

</script>

<template>
    <VBtn icon density="comfortable">
        <VTooltip activator="parent">
            {{ t('command.entityViewer.scopeSelector.title') }}
        </VTooltip>
        <VIcon>mdi-layers-search</VIcon>
        <VMenu activator="parent">
            <VList>

                <VListItem class="px-4">
                    <VCheckbox
                        v-model="liveSelection"
                        hide-details
                        density="comfortable"
                        class="ma-0 pa-0"
                    >
                        <template #label>
                            <VTooltip location="top">
                                <template #activator="{ props }">
                                    <span v-bind="props">{{ t('command.entityViewer.scopeSelector.live') }}</span>
                                </template>
                                {{ t('entityViewer.layerSelector.live') }}
                            </VTooltip>
                        </template>
                    </VCheckbox>
                </VListItem>

                <VListItem class="px-4">
                    <VCheckbox
                        v-model="archiveSelection"
                        hide-details
                        density="comfortable"
                        class="ma-0 pa-0"
                    >
                        <template #label>
                            <VTooltip location="top">
                                <template #activator="{ props }">
                                    <span v-bind="props">{{ t('command.entityViewer.scopeSelector.archive') }}</span>
                                </template>
                                {{ t('entityViewer.layerSelector.archive') }}
                            </VTooltip>
                        </template>
                    </VCheckbox>
                </VListItem>

            </VList>
        </VMenu>
    </VBtn>
</template>

<style scoped lang="scss">
.item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
</style>
