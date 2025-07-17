<script setup lang="ts">

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { List } from 'immutable'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AssociatedDataSchema
}>()

const flags: ComputedRef<List<Flag>> = computed(() => props.schema.representativeFlags)

function openAssociatedDataSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof EntitySchemaPointer)) {
        throw new UnexpectedError('Unsupported parent schema for entities.')
    }
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        new AssociatedDataSchemaPointer(
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
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        @open="openAssociatedDataSchema"
    />
</template>

<style lang="scss" scoped>

</style>
