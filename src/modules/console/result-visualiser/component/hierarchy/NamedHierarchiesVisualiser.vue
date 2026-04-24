<script setup lang="ts">
/**
 * Visualises named hierarchies for a single reference. Lists all named hierarchy entries.
 */
import { VisualisedReferenceHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import NamedHierarchyVisualiser
    from '@/modules/console/result-visualiser/component/hierarchy/NamedHierarchyVisualiser.vue'

const props = defineProps<{
    referenceHierarchy: VisualisedReferenceHierarchy
}>()
</script>

<template>
    <VList density="compact">
        <NamedHierarchyVisualiser
            v-for="entry in referenceHierarchy.namedHierarchies"
            :key="entry.name"
            :named-hierarchy-entry="entry"
        />
    </VList>
</template>

<style lang="scss" scoped>

</style>
