<script setup lang="ts">
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { List } from 'immutable'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import { computed, ComputedRef } from 'vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const flags: ComputedRef<List<string>> = computed(() => props.schema.representativeFlags)

function openReferenceSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof EntitySchemaPointer)) {
        throw new UnexpectedError('Unsupported parent schema for entities.')
    }
    workspaceService.createTab(schemaViewerTabFactory.createNew(
        props.dataPointer.connection,
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
        :deprecated="!!schema.deprecationNotice.getIfSupported()"
        :flags="flags"
        @open="openReferenceSchema"
    />
</template>

<style lang="scss" scoped>

</style>
