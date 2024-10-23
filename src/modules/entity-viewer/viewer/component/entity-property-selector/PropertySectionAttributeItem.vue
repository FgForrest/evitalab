<script setup lang="ts">/**
 * A single selectable entity attribute property item that will be then fetched into grid.
 */
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { computed, ComputedRef, ref, watch } from 'vue'
import { List } from 'immutable'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import PropertySectionItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionItem.vue'
import { useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void
}>()
const tabProps = useTabProps()

const schema: ComputedRef<AttributeSchema> = computed(() => {
    if (props.propertyDescriptor.schema == undefined || !(props.propertyDescriptor.schema instanceof AttributeSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'AttributeSchema'.`)
    }
    return props.propertyDescriptor.schema
})

const flags: ComputedRef<List<string>> = computed(() => schema.value!.representativeFlags)

function openSchema(): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
            new EntityAttributeSchemaPointer(
                tabProps.params.dataPointer.catalogName,
                tabProps.params.dataPointer.entityType,
                schema.value!.name
            )
        )
    )
    emit('schemaOpen')
}
</script>

<template>
    <PropertySectionItem
        :value="propertyDescriptor.key"
        :title="propertyDescriptor.title"
        :description="schema!.description.getIfSupported()!"
        :flags="flags"
        openable
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
