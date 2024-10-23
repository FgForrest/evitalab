<script setup lang="ts">
/**
 * Visualises raw JSON hierarchies of a single reference
 */
import { ref } from 'vue'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import NamedHierarchyVisualiser
    from '@/modules/console/result-visualiser/component/hierarchy/NamedHierarchyVisualiser.vue'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'

const connectionService: ConnectionService = useConnectionService()
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
            const representativeAttributes: string[] = Array.from(props.parentEntitySchema.attributes.getIfSupported()!.values()!)
                .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
                .map(attributeSchema => attributeSchema.nameVariants.getIfSupported()!.get(NamingConvention.CamelCase)!)
            resolve(representativeAttributes)
        })
    } else if (!props.referenceSchema.referencedEntityTypeManaged.getOrElse(false)) {
        pipeline = new Promise(resolve => resolve([]))
    } else {
        pipeline = connectionService.getEntitySchema(
            props.catalogPointer.connection,
            props.catalogPointer.catalogName,
            props.referenceSchema.entityType.getIfSupported()! as string
        )
            .then((entitySchema: EntitySchema) => {
                return Array.from(entitySchema.attributes.getIfSupported()!.values()!)
                    .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
                    .map(attributeSchema => attributeSchema.nameVariants.getIfSupported()!.get(NamingConvention.CamelCase)!)
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
        <NamedHierarchyVisualiser
            v-for="name in namedHierarchiesResult.keys()"
            :key="name"
            :visualiser-service="visualiserService"
            :name="name as string"
            :named-hierarchy-result="namedHierarchiesResult.get(name) as Result"
            :entity-representative-attributes="entityRepresentativeAttributes"
        />
    </VList>
</template>

<style lang="scss" scoped>

</style>
