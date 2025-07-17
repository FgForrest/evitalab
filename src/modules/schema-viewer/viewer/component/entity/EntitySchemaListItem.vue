<script setup lang="ts">

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { List } from 'immutable'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: EntitySchema
}>()

const flags: ComputedRef<List<Flag>> = computed(() => props.schema.representativeFlags)

function openEntitySchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof CatalogSchemaPointer)) {
        throw new UnexpectedError('Unsupported parent schema for entities.')
    }
    workspaceService.createTab(schemaViewerTabFactory.createNew(
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
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        @open="openEntitySchema"
    />
</template>

<style lang="scss" scoped>

</style>
