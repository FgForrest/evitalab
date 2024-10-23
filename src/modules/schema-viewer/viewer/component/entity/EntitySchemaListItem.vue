<script setup lang="ts">

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { List } from 'immutable'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import { computed, ComputedRef } from 'vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: EntitySchema
}>()

const flags: ComputedRef<List<string>> = computed(() => props.schema.representativeFlags)

function openEntitySchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof CatalogSchemaPointer)) {
        throw new UnexpectedError('Unsupported parent schema for entities.')
    }
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        props.dataPointer.connection,
        new EntitySchemaPointer(
            props.dataPointer.schemaPointer.catalogName,
            props.schema.name
        )
    ))
}
</script>

<template>
    <SchemaContainerSectionListItem
        :name="schema.name"
        :deprecated="!!schema.deprecationNotice.getIfSupported()"
        :flags="flags"
        @open="openEntitySchema"
    />
</template>

<style lang="scss" scoped>

</style>
