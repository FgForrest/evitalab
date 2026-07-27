<script setup lang="ts">
/**
 * Special entity property value renderer for a reference-attribute column. Mirrors the references column detail:
 * references are grouped and filtered by their representative reference attribute values, but each item shows this
 * column's attribute value instead of the target entity's representative attributes.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    EntityViewerService,
    useEntityViewerService,
    type ReferenceFilterData,
    type ReferenceGroup
} from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import {
    buildReferenceSummaryProperties
} from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/referenceSummary'
import ReferenceGroupFilter
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ReferenceGroupFilter.vue'
import ReferenceGroupedList
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ReferenceGroupedList.vue'
import ReferenceAttributesDetailRendererItem
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ReferenceAttributesDetailRendererItem.vue'
import {
    useDataLocale,
    useEntityPropertyDescriptor,
    useQueryLanguage,
    useTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'

const workspaceService: WorkspaceService = useWorkspaceService()
const entityViewerService: EntityViewerService = useEntityViewerService()
const entityViewerTabFactory: EntityViewerTabFactory = useEntityViewerTabFactory()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    fillSpace?: boolean
}>(), {
    fillSpace: true
})
const tabProps = useTabProps()
const queryLanguage = useQueryLanguage()
const dataLocale = useDataLocale()
const propertyDescriptor = useEntityPropertyDescriptor()

const parentReferenceSchema = computed<ReferenceSchema>(() => {
    if (propertyDescriptor?.parentSchema == undefined || !(propertyDescriptor.parentSchema instanceof ReferenceSchema)) {
        throw new UnexpectedError(`Parent schema is expected to be present and of type 'ReferenceSchema'.`)
    }
    return propertyDescriptor.parentSchema
})
const referenceAttributeSchema = computed<AttributeSchema>(() => {
    if (propertyDescriptor?.schema == undefined || !(propertyDescriptor.schema instanceof AttributeSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'AttributeSchema'.`)
    }
    return propertyDescriptor.schema
})

const references = computed<EntityReferenceValue[]>(() => {
    if (!(props.value instanceof EntityReferenceAttributes)) {
        console.error(t('entityViewer.grid.referenceAttributeRenderer.notification.invalidReferenceAttributesObject'))
        return []
    }
    return props.value.values
})

const rawAttributeDataType = computed<Scalar>(() => referenceAttributeSchema.value.type)
const isArray = computed<boolean>(() => rawAttributeDataType.value?.endsWith('Array') || false)
const attributeDataType = computed<Scalar>(() => {
    if (isArray.value) {
        return (rawAttributeDataType.value as string).replace('Array', '') as Scalar
    }
    return rawAttributeDataType.value
})

const filterData = computed<ReferenceFilterData>(() => entityViewerService.collectReferenceFilterData(references.value))
const hasFilters = computed<boolean>(() => filterData.value.size > 0)
const selections = ref<Map<string, string[]>>(new Map())

const filteredReferences = computed<EntityReferenceValue[]>(() =>
    entityViewerService.filterReferences(references.value, selections.value))
const groups = computed<ReferenceGroup[]>(() => entityViewerService.groupReferences(filteredReferences.value))

const summaryProperties = computed<Property[]>(() => [
    ...buildReferenceSummaryProperties(
        t,
        parentReferenceSchema.value,
        references.value.length,
        filteredReferences.value.length
    ),
    new Property(
        t('entityViewer.grid.referenceDetail.label.attributeType'),
        new PropertyValue(new KeywordValue(referenceAttributeSchema.value.type))
    )
])

function openFilteredReferences(): void {
    const primaryKeys: number[] = filteredReferences.value.map(reference => reference.primaryKey)
    if (primaryKeys.length === 0) {
        return
    }
    openInNewGrid(parentReferenceSchema.value.entityType, primaryKeys)
}

function openReference(primaryKey: number): void {
    openInNewGrid(parentReferenceSchema.value.entityType, [primaryKey])
}

function openGroup(groupPrimaryKey: number): void {
    if (parentReferenceSchema.value.referencedGroupType == undefined) {
        return
    }
    openInNewGrid(parentReferenceSchema.value.referencedGroupType, [groupPrimaryKey])
}

function openInNewGrid(entityType: string, primaryKeys: number[]): void {
    workspaceService.createTab(entityViewerTabFactory.createNew(
        tabProps.params.dataPointer.catalogName,
        entityType,
        new EntityViewerTabData(
            queryLanguage.value,
            entityViewerService.buildReferencedEntityFilterBy(queryLanguage.value as QueryLanguage, primaryKeys),
            undefined,
            dataLocale?.value
        ),
        true
    ))
}
</script>

<template>
    <div class="reference-attributes-renderer">
        <div class="reference-attributes-renderer__toolbar">
            <VPropertiesTable :properties="summaryProperties" class="reference-attributes-renderer__summary" />
            <VBtn
                v-if="parentReferenceSchema.referencedEntityTypeManaged"
                icon
                variant="text"
                density="compact"
                :disabled="filteredReferences.length === 0"
                @click="openFilteredReferences"
            >
                <VIcon>mdi-open-in-new</VIcon>
                <VTooltip activator="parent">
                    {{ t('entityViewer.grid.referenceAttributeRenderer.button.openFilteredReferences') }}
                </VTooltip>
            </VBtn>
        </div>

        <ReferenceGroupFilter
            v-if="hasFilters"
            :filter-data="filterData"
            v-model="selections"
        />

        <ReferenceGroupedList :groups="groups">
            <template #item="{ item, index }">
                <ReferenceAttributesDetailRendererItem
                    :key="index"
                    :reference="item"
                    :attribute-data-type="attributeDataType"
                    :managed="parentReferenceSchema.referencedEntityTypeManaged"
                    :group-managed="parentReferenceSchema.referencedGroupTypeManaged === true"
                    @open-entity="openReference"
                    @open-group="openGroup"
                />
            </template>
        </ReferenceGroupedList>
    </div>
</template>

<style lang="scss" scoped>
.reference-attributes-renderer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem;

    &__toolbar {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
    }

    &__summary {
        flex: 1;
    }
}
</style>
