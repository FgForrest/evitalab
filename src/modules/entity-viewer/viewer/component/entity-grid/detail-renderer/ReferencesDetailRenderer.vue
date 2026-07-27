<script setup lang="ts">
/**
 * Special entity property value renderer for the references column. Shows a summary of the reference, a set of
 * filters (one per representative reference attribute) and the references grouped by their representative reference
 * attribute values. The whole filtered list, or a single reference, can be opened in a new grid.
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
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { Property } from '@/modules/base/model/properties-table/Property'
import {
    buildReferenceSummaryProperties
} from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/referenceSummary'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'
import ReferenceGroupFilter
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ReferenceGroupFilter.vue'
import ReferenceGroupedList
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ReferenceGroupedList.vue'
import ReferencesDetailRendererReferenceItem
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ReferencesDetailRendererReferenceItem.vue'
import {
    useDataLocale,
    useEntityPropertyDescriptor,
    useQueryLanguage,
    useTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'

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

const referenceSchema = computed<ReferenceSchema>(() => {
    if (propertyDescriptor?.schema == undefined || !(propertyDescriptor.schema instanceof ReferenceSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'ReferenceSchema'.`)
    }
    return propertyDescriptor.schema
})

const references = computed<EntityReferenceValue[]>(() => {
    if (!(props.value instanceof EntityReferences)) {
        console.error(t('entityViewer.grid.referencesRenderer.notification.invalidReferencesObject'))
        return []
    }
    return props.value.references
})

const filterData = computed<ReferenceFilterData>(() => entityViewerService.collectReferenceFilterData(references.value))
const hasFilters = computed<boolean>(() => filterData.value.size > 0)
const selections = ref<Map<string, string[]>>(new Map())

const filteredReferences = computed<EntityReferenceValue[]>(() =>
    entityViewerService.filterReferences(references.value, selections.value))
const groups = computed<ReferenceGroup[]>(() => entityViewerService.groupReferences(filteredReferences.value))

const summaryProperties = computed<Property[]>(() => buildReferenceSummaryProperties(
    t,
    referenceSchema.value,
    references.value.length,
    filteredReferences.value.length
))

function openFilteredReferences(): void {
    const primaryKeys: number[] = filteredReferences.value.map(reference => reference.primaryKey)
    if (primaryKeys.length === 0) {
        return
    }
    openInNewGrid(referenceSchema.value.entityType, primaryKeys)
}

function openReference(primaryKey: number): void {
    openInNewGrid(referenceSchema.value.entityType, [primaryKey])
}

function openGroup(groupPrimaryKey: number): void {
    if (referenceSchema.value.referencedGroupType == undefined) {
        return
    }
    openInNewGrid(referenceSchema.value.referencedGroupType, [groupPrimaryKey])
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
    <div class="references-renderer">
        <div class="references-renderer__toolbar">
            <VPropertiesTable :properties="summaryProperties" class="references-renderer__summary" />
            <VBtn
                v-if="referenceSchema.referencedEntityTypeManaged"
                icon
                variant="text"
                density="compact"
                :disabled="filteredReferences.length === 0"
                @click="openFilteredReferences"
            >
                <VIcon>mdi-open-in-new</VIcon>
                <VTooltip activator="parent">
                    {{ t('entityViewer.grid.referencesRenderer.button.openFilteredReferences') }}
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
                <ReferencesDetailRendererReferenceItem
                    :key="index"
                    :reference="item"
                    :managed="referenceSchema.referencedEntityTypeManaged"
                    :group-managed="referenceSchema.referencedGroupTypeManaged === true"
                    @open-entity="openReference"
                    @open-group="openGroup"
                />
            </template>
        </ReferenceGroupedList>
    </div>
</template>

<style lang="scss" scoped>
.references-renderer {
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
