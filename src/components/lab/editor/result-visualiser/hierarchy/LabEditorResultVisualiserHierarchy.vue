<script setup lang="ts">
/**
 * Visualises raw JSON hierarchies.
 */

import { EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { CatalogPointer } from '@/model/editor/editor'
import { computed } from 'vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorResultVisualiserMissingDataIndicator
    from '@/components/lab/editor/result-visualiser/LabEditorResultVisualiserMissingDataIndicator.vue'
import LabEditorResultVisualiserReferenceNamedHierarchies
    from '@/components/lab/editor/result-visualiser/hierarchy/LabEditorResultVisualiserReferenceNamedHierarchies.vue'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import { Result } from '@/model/editor/result-visualiser'

const toaster: Toaster = useToaster()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    hierarchyResult: Result,
    entitySchema: EntitySchema,
}>()

const referencesWithNamedHierarchiesResults = computed<[ReferenceSchema | undefined, Result][]>(() => {
    try {
        return props.visualiserService
            .getHierarchyService()
            .findNamedHierarchiesByReferencesResults(props.hierarchyResult, props.entitySchema)
    } catch (e: any) {
        toaster.error(e)
        return []
    }
})

function getPanelKey(referenceSchema: ReferenceSchema | undefined): string {
    if (referenceSchema == undefined) {
        return 'self'
    }
    return referenceSchema.name
}
</script>

<template>
    <VExpansionPanels v-if="referencesWithNamedHierarchiesResults && referencesWithNamedHierarchiesResults.length > 0" variant="accordion">
        <VExpansionPanel v-for="referenceWithNamedHierarchResult in referencesWithNamedHierarchiesResults" :key="getPanelKey(referenceWithNamedHierarchResult[0])">
            <VExpansionPanelTitle class="d-flex">
                <VIcon class="mr-8">mdi-link-variant</VIcon>
                {{ referenceWithNamedHierarchResult[0]?.name ?? `${entitySchema.name} (self)` }} ({{ Object.values(referenceWithNamedHierarchResult[1]).length }})
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <LabEditorResultVisualiserReferenceNamedHierarchies
                    :catalog-pointer="catalogPointer"
                    :visualiser-service="visualiserService"
                    :parent-entity-schema="entitySchema"
                    :reference-schema="referenceWithNamedHierarchResult[0]"
                    :named-hierarchies-result="referenceWithNamedHierarchResult[1]"
                />
            </VExpansionPanelText>
        </VExpansionPanel>
    </VExpansionPanels>

    <LabEditorResultVisualiserMissingDataIndicator
        v-else
        icon="mdi-text-search"
        title="No hierarchies found."
    />
</template>

<style lang="scss" scoped>

</style>
