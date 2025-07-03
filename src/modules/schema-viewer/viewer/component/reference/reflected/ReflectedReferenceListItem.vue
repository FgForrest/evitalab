<script setup lang="ts">

import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    ReflectedRefenceSchema
} from '@/modules/database-driver/request-response/schema/ReflectedRefenceSchema.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer.ts'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReflectedRefenceSchema
}>()

function openReferenceSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof ReferenceSchemaPointer)) {
        throw new UnexpectedError('Unsupported parent schema for entities.')
    }
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        new ReferenceSchemaPointer(
            props.dataPointer.schemaPointer.catalogName,
            props.dataPointer.schemaPointer.entityType,
            props.schema.name
        )
    ))
}
</script>

<template>
    <SchemaContainerSectionListItem
        :name="schema.name"
        :flags="schema.representativeFlags"
        :reflected="true"
        @open="openReferenceSchema"
    />
</template>

<style scoped lang="scss">

</style>
