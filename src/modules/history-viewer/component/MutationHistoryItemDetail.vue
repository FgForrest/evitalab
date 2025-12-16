<script setup lang="ts">

import {
    Action,
    type MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import RecordMetadata from '@/modules/history-viewer/component/RecordMetadata.vue'
import { JfrViewerTabDefinition } from '@/modules/jfr-viewer/model/JfrViewerTabDefinition.ts'
import VTabToolbar from '@/modules/base/component/VTabToolbar.vue'

const props = defineProps<{
    definition: MutationHistoryItemVisualisationDefinition
}>()

function callAction(action: Action): void {
    if (action.callback != undefined) {
        action.callback()
    }
}
</script>

<template>
    <VListItem >
        <template #title>
                <strong>
                    <VIcon class="mr-1">{{ definition.icon }}</VIcon>
                    {{ definition.title }}
                </strong>

                <VTooltip v-if="definition.details && definition.details.length >= 100">
                    <template #activator="{ props }">
          <span v-bind="props" class="text-subtitle-1 ml-2 cursor-help">
            {{ definition.details.substring(0, 100) }}
          </span>
                    </template>
                    {{ definition.details }}
                </VTooltip>

                <span v-else-if="definition.details" class="text-subtitle-1 ml-2">
        {{ definition.details }}
      </span>
        </template>

        <template v-if="definition.metadata.length > 0" #subtitle>
            <RecordMetadata :metadata="definition.metadata" />
        </template>
        <template v-if="definition.actions.size > 0" #append="{ isActive }">
            <VBtn
                v-for="(action, index) in definition.actions"
                :key="index"
                icon
                @click.stop="callAction(action)"
            >
                <VIcon>{{ action.icon }}</VIcon>
                <VTooltip activator="parent">
                    {{ action.title }}
                </VTooltip>
            </VBtn>

            <VIcon v-if="definition.children.size > 0" class="ml-2">
                {{ isActive ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </VIcon>
        </template>
    </VListItem>
</template>

<style lang="scss" scoped>

</style>
