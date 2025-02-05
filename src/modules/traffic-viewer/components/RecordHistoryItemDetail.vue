<script setup lang="ts">

import {
    Action,
    TrafficRecordVisualisationDefinition
} from '@/modules/traffic-viewer/model/TrafficRecordVisualisationDefinition'
import RecordMetadata from '@/modules/traffic-viewer/components/RecordMetadata.vue'

const props = defineProps<{
    definition: TrafficRecordVisualisationDefinition
}>()

function callAction(action: Action): void {
    if (action.callback != undefined) {
        action.callback()
    }
}
</script>

<template>
    <VListItem>
        <template #title>
            <strong>{{ definition.title }}</strong>
            <span v-if="definition.details != undefined" class="text-subtitle-1 ml-2">{{ definition.details }}</span>
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
