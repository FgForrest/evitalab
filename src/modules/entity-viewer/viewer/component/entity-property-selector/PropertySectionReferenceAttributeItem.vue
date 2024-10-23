<script setup lang="ts">
/**
 * A single selectable reference attribute property item that will be then fetched into grid.
 */

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { computed, ComputedRef } from 'vue'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import PropertySectionItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionItem.vue'
import { List } from 'immutable'
import { useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    referencePropertyDescriptor: EntityPropertyDescriptor,
    attributePropertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()
const tabProps = useTabProps()

const referenceSchema: ComputedRef<ReferenceSchema> = computed(() => {
    if (props.referencePropertyDescriptor.schema == undefined || !(props.referencePropertyDescriptor.schema instanceof ReferenceSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'ReferenceSchema'.`)
    }
    return props.referencePropertyDescriptor.schema
})
const referenceAttributeSchema: ComputedRef<AttributeSchema> = computed(() => {
    if (props.attributePropertyDescriptor.schema == undefined || !(props.attributePropertyDescriptor.schema instanceof AttributeSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'AttributeSchema'.`)
    }
    return props.attributePropertyDescriptor.schema
})

const flags: ComputedRef<List<string>> = computed(() => referenceAttributeSchema.value.representativeFlags)

function openSchema(): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
            new ReferenceAttributeSchemaPointer(
                tabProps.params.dataPointer.catalogName,
                tabProps.params.dataPointer.entityType,
                referenceSchema.value.name,
                referenceAttributeSchema.value.name
            )
        )
    )
    emit('schemaOpen')
}
</script>

<template>
    <PropertySectionItem
        :value="attributePropertyDescriptor.key"
        :title="attributePropertyDescriptor.title"
        :description="referenceAttributeSchema.description.getIfSupported()!"
        :flags="flags"
        openable
        @toggle="emit('toggle', $event)"
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
