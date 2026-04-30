<script setup lang="ts">
/**
 * Visualises fully resolved hierarchy extra results as expansion panels grouped by reference.
 */
import { useI18n } from 'vue-i18n'
import { VisualisedHierarchyResult, VisualisedReferenceHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyResult'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import NamedHierarchiesVisualiser
    from '@/modules/console/result-visualiser/component/hierarchy/NamedHierarchiesVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const { t } = useI18n()

const props = defineProps<{
    hierarchyResult: VisualisedHierarchyResult,
    entitySchema: EntitySchema | undefined
}>()

function getPanelKey(referenceHierarchy: VisualisedReferenceHierarchy): string {
    if (referenceHierarchy.referenceSchema == undefined) {
        return 'self'
    }
    return referenceHierarchy.referenceSchema.name
}

function getPanelTitle(referenceHierarchy: VisualisedReferenceHierarchy): string {
    if (referenceHierarchy.referenceSchema == undefined) {
        return `${props.entitySchema?.name ?? 'Self'} (self)`
    }
    return referenceHierarchy.referenceSchema.name
}
</script>

<template>
    <VExpansionPanels v-if="hierarchyResult.references.length > 0">
        <VExpansionPanel v-for="referenceHierarchy in hierarchyResult.references" :key="getPanelKey(referenceHierarchy)">
            <VExpansionPanelTitle class="d-flex">
                <VIcon class="mr-8">mdi-link-variant</VIcon>
                {{ getPanelTitle(referenceHierarchy) }} ({{ referenceHierarchy.namedHierarchies.length }})
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <NamedHierarchiesVisualiser
                    :reference-hierarchy="referenceHierarchy"
                />
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <VMissingDataIndicator
        v-else
        icon="mdi-text-search"
        :title="t('resultVisualizer.hierarchyVisualiser.placeholder.noHierarchies')"
    />
</template>

<style lang="scss" scoped>

</style>
