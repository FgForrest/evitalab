<script setup lang="ts">

import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    AttributeElement
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer.ts'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory.ts'
import {
    SortableAttributeCompoundSchemaPointer
} from '@/modules/schema-viewer/viewer/model/SortableAttributeCompoundSchemaPointer.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeElement
}>()

function openAttributeSchema(): void {
    const parentSchemaPointer = props.dataPointer.schemaPointer
    if(parentSchemaPointer instanceof SortableAttributeCompoundSchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
            new EntityAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                props.schema.attributeName
            )
        ))
    }
}
</script>

<template>
    <SchemaContainerSectionListItem :name="schema.attributeName" @open="() => openAttributeSchema()" :flags="schema.representativeFlags" />
</template>

<style scoped lang="scss">

</style>
