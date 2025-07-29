<script setup lang="ts">

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
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
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import {
    AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'
import { useI18n } from 'vue-i18n'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchema,
    inheritedAttributesFilter?: string[]
    attributeInheritanceBehavior?: AttributeInheritanceBehavior
}>()

const flags: ComputedRef<List<string>> = computed(() => {
    const flags: string[] = props.schema.representativeFlags.toArray()
    //Important fix != undefined because when it is 0 it fails
    if(props.attributeInheritanceBehavior != undefined && props.inheritedAttributesFilter) {
        if (props.inheritedAttributesFilter?.includes(props.schema.name) && props.attributeInheritanceBehavior === AttributeInheritanceBehavior.InheritOnlySpecified) {
            flags.push(t('schemaViewer.reference.label.inherited'))
        } else if(!props.inheritedAttributesFilter?.includes(props.schema.name) && props.attributeInheritanceBehavior === AttributeInheritanceBehavior.InheritAllExcept) {
            flags.push(t('schemaViewer.reference.label.inherited'))
        }
    }
    return List(flags)
})

function openAttributeSchema(): void {
    const parentSchemaPointer = props.dataPointer.schemaPointer
    if (parentSchemaPointer instanceof CatalogSchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
            new CatalogAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof EntitySchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
            new EntityAttributeSchemaPointer(
                parentSchemaPointer.catalogName,
                parentSchemaPointer.entityType,
                props.schema.name
            )
        ))
    } else if (parentSchemaPointer instanceof ReferenceSchemaPointer) {
        workspaceService.createTab(schemaViewerTabFactory.createNew(
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
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        @open="openAttributeSchema"
    />
</template>

<style lang="scss" scoped>

</style>
