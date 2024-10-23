<script setup lang="ts">
/**
 * A single selectable entity prices property item that will be then fetched into grid.
 */

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
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

function openSchema(): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
            new EntitySchemaPointer(
                tabProps.params.dataPointer.catalogName,
                tabProps.params.dataPointer.entityType
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
        openable
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
