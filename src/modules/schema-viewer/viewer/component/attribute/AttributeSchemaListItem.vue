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
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { Flag, FlagType } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { useI18n } from 'vue-i18n'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const { t } = useI18n()
const showTooltip = ref<boolean>(false)

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: AttributeSchema
}>()

const flags: ComputedRef<List<Flag>> = computed(() => {
    const flags: Flag[] = []

    for (const flag of props.schema.representativeFlags) {
        if (flag.includes(FlagType.Sortable) && props.schema.sortableInScopes) {
            showTooltip.value = true
            flags.push(new Flag(flag, Object.values(props.schema.sortableInScopes.toArray()), t('schemaViewer.section.flag.attributeSchema.attributeTooltip')))
        } else if (flag.includes(FlagType.Filterable) && props.schema.filteredInScopes) {
            showTooltip.value = true
            flags.push(new Flag(flag, Object.values(props.schema.filteredInScopes.toArray()), t('schemaViewer.section.flag.attributeSchema.attributeTooltip')))
        } else if (flag.includes(FlagType.Unique) && props.schema.uniqueInScopes) {
            showTooltip.value = true
            flags.push(new Flag(flag, Object.values(props.schema.uniqueInScopes.toArray()), t('schemaViewer.section.flag.attributeSchema.attributeTooltip')))
        } else if (flag.includes(FlagType.GloballyUnique) && props.schema.uniqueGloballyInScopes) {
            showTooltip.value = true
            flags.push(new Flag(flag, Object.values(props.schema.uniqueGloballyInScopes.toArray()), t('schemaViewer.section.flag.attributeSchema.attributeTooltip')))
        } else
            flags.push(new Flag(flag))
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
        :tooltip="t('schemaViewer.section.flag.attributeSchema.attributeTooltip')"
        :show-tooltip="showTooltip"
        @open="openAttributeSchema"
    />
</template>

<style lang="scss" scoped>

</style>
