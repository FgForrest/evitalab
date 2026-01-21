<script setup lang="ts">
/**
 * Visualises raw JSON hierarchies of a single reference
 */
import { ref } from 'vue'
import type { Ref } from 'vue'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import type { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import NamedHierarchyVisualiser
    from '@/modules/console/result-visualiser/component/hierarchy/NamedHierarchyVisualiser.vue'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { CatalogPointer } from '@/modules/viewer-support/model/CatalogPointer'
import {
    useCatalogPointer,
    useRootEntitySchema,
    useVisualiserService
} from '@/modules/console/result-visualiser/component/dependencies'

const toaster: Toaster = useToaster()

const props = defineProps<{
    namedHierarchiesResult: Result,
    referenceSchema: ReferenceSchema | undefined
}>()

const visualiserService: ResultVisualiserService = useVisualiserService()
const catalogPointer: CatalogPointer = useCatalogPointer()
const rootEntitySchema: Ref<EntitySchema | undefined> = useRootEntitySchema()

const initialized = ref<boolean>(false)
const entityRepresentativeAttributes: string[] = []

function initialize() {
    let pipeline: Promise<string[]>
    if (!props.referenceSchema) {
        pipeline = new Promise(resolve => {
            const representativeAttributes: string[] = Array.from(rootEntitySchema.value!.attributes.values())
                .filter(attributeSchema => attributeSchema.representative)
                .map(attributeSchema => attributeSchema.nameVariants.get(NamingConvention.CamelCase)!)
            resolve(representativeAttributes)
        })
    } else if (!props.referenceSchema.referencedEntityTypeManaged) {
        pipeline = new Promise(resolve => resolve([]))
    } else {
        pipeline = visualiserService.resolveRepresentativeAttributes(
            catalogPointer.catalogName,
            props.referenceSchema.entityType
        )
    }

    pipeline
        .then((representativeAttributes: string[]) => {
            entityRepresentativeAttributes.push(...representativeAttributes)
            initialized.value = true
        })
        .catch((e: Error) => toaster.error('Could not load hierarchies', e).then())
}
initialize()
</script>

<template>
    <VList v-if="initialized" density="compact">
        <NamedHierarchyVisualiser
            v-for="name in namedHierarchiesResult.keys()"
            :key="name"
            :name="name as string"
            :named-hierarchy-result="namedHierarchiesResult.get(name) as Result"
            :entity-representative-attributes="entityRepresentativeAttributes"
        />
    </VList>
</template>

<style lang="scss" scoped>

</style>
