<script setup lang="ts">
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { List } from 'immutable'
import SchemaContainerSectionListItem from '@/modules/schema-viewer/viewer/component/SchemaContainerSectionListItem.vue'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { Flag, FlagType } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { useI18n } from 'vue-i18n'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const flags: ComputedRef<List<Flag>> = computed(() => {
    const flags: Flag[] = []
    for(const flag of props.schema.representativeFlags){
        if(flag.includes(FlagType.Faceted) && props.schema.facetedInScopes)
            flags.push(new Flag(flag, Object.values(props.schema.facetedInScopes.toArray()), t('schemaViewer.section.flag.attributeSchema.referenceTooltipFaceted')))
        else if(flag.includes(FlagType.Indexed) && props.schema.indexedInScopes)
            flags.push(new Flag(flag, Object.values(props.schema.indexedInScopes.toArray()), t('schemaViewer.section.flag.attributeSchema.referenceTooltipIndexed')))
        else
            flags.push(new Flag(flag))
    }

    return List(flags)
})

function openReferenceSchema(): void {
    if (!(props.dataPointer.schemaPointer instanceof EntitySchemaPointer)) {
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
        :deprecated="!!schema.deprecationNotice"
        :flags="flags"
        :tooltip="t('')"
        @open="openReferenceSchema"
    />
</template>

<style lang="scss" scoped>

</style>
