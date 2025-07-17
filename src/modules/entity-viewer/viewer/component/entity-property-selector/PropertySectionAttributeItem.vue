<script setup lang="ts">/**
 * A single selectable entity attribute property item that will be then fetched into grid.
 */
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { List } from 'immutable'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import PropertySectionItem
    from '@/modules/entity-viewer/viewer/component/entity-property-selector/PropertySectionItem.vue'
import { useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'
import type { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey.ts'
import type { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor
}>()
const emit = defineEmits<{
    (e: 'schemaOpen'): void,
    (e: 'changeState', key: EntityPropertyKey, isSelected: boolean): void,
}>()
const tabProps = useTabProps()

const schema: ComputedRef<AttributeSchema> = computed(() => {
    if (props.propertyDescriptor.schema == undefined || !(props.propertyDescriptor.schema instanceof AttributeSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'AttributeSchema'.`)
    }
    return props.propertyDescriptor.schema
})

const flags: ComputedRef<List<Flag>> = computed(() => schema.value!.representativeFlags)

function openSchema(): void {
    workspaceService.createTab(
        schemaViewerTabFactory.createNew(
            new EntityAttributeSchemaPointer(
                tabProps.params.dataPointer.catalogName,
                tabProps.params.dataPointer.entityType,
                schema.value!.name
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
        :description="schema!.description"
        :flags="flags"
        openable
        @schema-open="openSchema"
        @toggle="value => emit(`changeState`, value.key, value.selected)"
    />
</template>

<style lang="scss" scoped>

</style>
