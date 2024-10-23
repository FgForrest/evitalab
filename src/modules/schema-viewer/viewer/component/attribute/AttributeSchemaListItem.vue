<script setup lang="ts">

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { List } from 'immutable'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import { computed, ComputedRef } from 'vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchema
}>()

const flags: ComputedRef<List<string>> = computed(() => props.schema.representativeFlags)

function openAttributeSchema(): void {
    const parentSchemaPointer = props.dataPointer.schemaPointer
    if (parentSchemaPointer instanceof CatalogSchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
            props.dataPointer.connection,
            new CatalogAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof EntitySchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
            props.dataPointer.connection,
            new EntityAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof ReferenceSchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
            props.dataPointer.connection,
            new ReferenceAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                parentSchemaPointer.referenceName,
                props.schema.name
            )
        ))
    } else {
        throw new UnexpectedError('Unsupported parent schema for attributes.')
    }
}
</script>

<template>
    <SchemaContainerSectionListItem
        :name="schema.name"
        :deprecated="!!schema.deprecationNotice.getIfSupported()"
        :flags="flags"
        @open="openAttributeSchema"
    />
</template>

<style lang="scss" scoped>

</style>
