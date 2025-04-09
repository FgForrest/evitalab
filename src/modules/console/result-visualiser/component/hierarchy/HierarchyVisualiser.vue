<script setup lang="ts">
/**
 * Visualises raw JSON hierarchies.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import NamedHierarchiesVisualiser
    from '@/modules/console/result-visualiser/component/hierarchy/NamedHierarchiesVisualiser.vue'
import VMissingDataIndicator from '@/modules/base/component/VMissingDataIndicator.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

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
        toaster.error('', e).then()
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
    <VExpansionPanels v-if="referencesWithNamedHierarchiesResults && referencesWithNamedHierarchiesResults.length > 0">
        <VExpansionPanel v-for="referenceWithNamedHierarchResult in referencesWithNamedHierarchiesResults" :key="getPanelKey(referenceWithNamedHierarchResult[0])">
            <VExpansionPanelTitle class="d-flex">
                <VIcon class="mr-8">mdi-link-variant</VIcon>
                {{ referenceWithNamedHierarchResult[0]?.name ?? `${entitySchema.name} (self)` }} ({{ Object.values(referenceWithNamedHierarchResult[1]).length }})
            </VExpansionPanelTitle>
            <VExpansionPanelText>
                <NamedHierarchiesVisualiser
                    :catalog-pointer="catalogPointer"
                    :visualiser-service="visualiserService"
                    :parent-entity-schema="entitySchema"
                    :reference-schema="referenceWithNamedHierarchResult[0]"
                    :named-hierarchies-result="referenceWithNamedHierarchResult[1]"
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
