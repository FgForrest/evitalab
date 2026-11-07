<script setup lang="ts">

import { useI18n } from 'vue-i18n'
import { SelectableScope } from '@/modules/entity-viewer/viewer/model/SelectableScope'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { ref, watch } from 'vue'

const { t } = useI18n()

const props = defineProps<{
    selectedScopes: SelectableScope[]
}>()

const emit = defineEmits<{
    (e: 'update:selected', value: SelectableScope[]): void
}>()

const liveSelection = ref<boolean>(props.selectedScopes.find(x => x.scope === EntityScope.Live)?.selected ?? false)
const archiveSelection = ref<boolean>(props.selectedScopes.find(x => x.scope === EntityScope.Archive)?.selected ?? false)

watch(liveSelection, () => {
    updatedSelection()
})

watch(archiveSelection, () => {
    updatedSelection()
})

function updatedSelection(): void {
    emit('update:selected', [
        new SelectableScope(EntityScope.Live, liveSelection.value),
        new SelectableScope(EntityScope.Archive, archiveSelection.value)
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
                                {{ t('entityViewer.scopeSelector.live') }}
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
                                {{ t('entityViewer.scopeSelector.archive') }}
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
