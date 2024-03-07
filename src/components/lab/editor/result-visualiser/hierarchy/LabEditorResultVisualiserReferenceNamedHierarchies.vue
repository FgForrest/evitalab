<script setup lang="ts">
/**
 * Visualises raw JSON hierarchies of a single reference
 */
import { ref } from 'vue'
import { EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { LabService, useLabService } from '@/services/lab.service'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorResultVisualiserNamedHierarchy
    from '@/components/lab/editor/result-visualiser/hierarchy/LabEditorResultVisualiserNamedHierarchy.vue'
import { Result } from '@/model/editor/result-visualiser'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import { CatalogPointer } from '@/model/editor/tab/CatalogPointer'

const labService: LabService = useLabService()
const toaster: Toaster = useToaster()

const props = defineProps<{
    catalogPointer: CatalogPointer,
    visualiserService: ResultVisualiserService,
    namedHierarchiesResult: Result,
    parentEntitySchema: EntitySchema,
    referenceSchema: ReferenceSchema | undefined
}>()

const initialized = ref<boolean>(false)
const entityRepresentativeAttributes: string[] = []

function initialize() {
    let pipeline: Promise<string[]>
    if (!props.referenceSchema) {
        pipeline = new Promise(resolve => {
            const representativeAttributes: string[] = Object.values(props.parentEntitySchema.attributes)
                .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
                .map(attributeSchema => attributeSchema.nameVariants.camelCase)
            resolve(representativeAttributes)
        })
    } else if (!props.referenceSchema.referencedEntityTypeManaged) {
        pipeline = new Promise(resolve => resolve([]))
    } else {
        pipeline = labService.getEntitySchema(
            props.catalogPointer.connection,
            props.catalogPointer.catalogName,
            props.referenceSchema.referencedEntityType as string
        )
            .then((entitySchema: EntitySchema) => {
                return Object.values(entitySchema.attributes)
                    .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
                    .map(attributeSchema => attributeSchema.nameVariants.camelCase)
            })
    }

    pipeline
        .then((representativeAttributes: string[]) => {
            entityRepresentativeAttributes.push(...representativeAttributes)
            initialized.value = true
        })
        .catch((e: Error) => toaster.error(e))
}
initialize()
</script>

<template>
    <VList v-if="initialized" density="compact">
        <LabEditorResultVisualiserNamedHierarchy
            v-for="(namedHierarchyResult, name) in namedHierarchiesResult"
            :key="name"
            :visualiser-service="visualiserService"
            :name="name as string"
            :named-hierarchy-result="namedHierarchyResult as Result[]"
            :entity-representative-attributes="entityRepresentativeAttributes"
        />
    </VList>
</template>

<style lang="scss" scoped>

</style>
