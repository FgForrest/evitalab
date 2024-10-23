<script setup lang="ts">
/**
 * A single selectable entity reference property item that will be then fetched into grid.
 */

import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { computed, ComputedRef } from 'vue'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { List } from 'immutable'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import PropertySectionItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionItem.vue'
import { useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = withDefaults(defineProps<{
    propertyDescriptor: EntityPropertyDescriptor,
    groupParent?: boolean
}>(), {
    groupParent: false
})
const emit = defineEmits<{
    (e: 'toggle', value: { key: EntityPropertyKey, selected: boolean }): void
    (e: 'schemaOpen'): void
}>()
const tabProps = useTabProps()

const schema: ComputedRef<ReferenceSchema> = computed(() => {
    if (props.propertyDescriptor.schema == undefined || !(props.propertyDescriptor.schema instanceof ReferenceSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'ReferenceSchema'.`)
    }
    return props.propertyDescriptor.schema
})

const flags: ComputedRef<List<string>> = computed(() => schema.value.representativeFlags)

function openSchema(): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            tabProps.params.dataPointer.connection,
            new ReferenceSchemaPointer(
                tabProps.params.dataPointer.catalogName,
                tabProps.params.dataPointer.entityType,
                schema.value.name
            )
        )
    )
    emit('schemaOpen')
}
</script>

<template>
    <PropertySectionItem
        :value="propertyDescriptor.key"
        :title="propertyDescriptor.title"
        :description="schema.description.getIfSupported()!"
        :flags="flags"
        openable
        :group-parent="groupParent"
        @toggle="emit('toggle', $event)"
        @schema-open="openSchema"
    />
</template>

<style lang="scss" scoped>

</style>
