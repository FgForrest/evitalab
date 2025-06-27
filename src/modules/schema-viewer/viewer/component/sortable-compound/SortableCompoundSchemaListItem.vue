<script setup lang="ts">
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import type { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import type {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import { computed, type ComputedRef } from 'vue'
import { List } from 'immutable'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService.ts'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory.ts'
import { SortableCompoundSchemaPointer } from '@/modules/schema-viewer/viewer/model/SortableCompoundSchemaPointer.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: SortableAttributeCompoundSchema
}>()

const flags: ComputedRef<List<string>> = computed(() => props.schema.representativeFlags)

function openSortableSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof EntitySchemaPointer)) {
        throw new UnexpectedError('Unsupported parent schema for entities.')
    }
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        new SortableCompoundSchemaPointer(props.dataPointer.schemaPointer.catalogName,
            props.dataPointer.schemaPointer.entityType)))
}
</script>

<template>
    <SchemaContainerSectionListItem
        :name="schema.name"
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        @open="openSortableSchema"
    />
</template>

<style scoped lang="scss">

</style>
