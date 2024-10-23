<script setup lang="ts">
/**
 * Special entity property value renderer for prices.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import {
    EntityViewerTabFactory,
    useEntityViewerTabFactory
} from '@/modules/entity-viewer/viewer/workspace/service/EntityViewerTabFactory'
import { EntityViewerTabData } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabData'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import EntityGridCellDetailValueListItem
    from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCellDetailValueListItem.vue'
import {
    useDataLocale,
    useEntityPropertyDescriptor,
    useQueryLanguage,
    useTabProps
} from '@/modules/entity-viewer/viewer/component/dependencies'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'

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
const gridProps = useTabProps()
const queryLanguage = useQueryLanguage()
const dataLocale = useDataLocale()
const propertyDescriptor = useEntityPropertyDescriptor()

const parentReferenceSchema = computed(() => {
    if (propertyDescriptor?.parentSchema == undefined || !(propertyDescriptor.parentSchema instanceof ReferenceSchema)) {
        throw new UnexpectedError(`Parent schema is expected to be present and of type 'ReferenceSchema'.`)
    }
    return propertyDescriptor.parentSchema
})
const referenceAttributeSchema = computed(() => {
    if (propertyDescriptor?.schema == undefined || !(propertyDescriptor.schema instanceof AttributeSchema)) {
        throw new UnexpectedError(`Schema is expected to be present and of type 'AttributeSchema'.`)
    }
    return propertyDescriptor.schema
})

const referencesWithAttributes = computed<EntityReferenceValue[]>(() => {
    if (props.value instanceof Array) {
        return props.value as EntityReferenceValue[]
    }
    return [props.value as EntityReferenceValue]
})

const rawAttributeDataType = computed<Scalar>(() => {
    return referenceAttributeSchema.value.type.getIfSupported()!
})
const isArray = computed<boolean>(() => rawAttributeDataType?.value?.endsWith('Array') || false)
const attributeDataType = computed<Scalar>(() => {
    if (isArray.value) {
        return (rawAttributeDataType.value as string).replace('Array', '') as Scalar
    } else {
        return rawAttributeDataType.value as Scalar
    }
})

function openReference(primaryKey: number): void {
    // we want references to open referenced entities in appropriate new grid for referenced collection
    workspaceService.createTab(entityViewerTabFactory.createNew(
        gridProps.params.dataPointer.connection,
        gridProps.params.dataPointer.catalogName,
        parentReferenceSchema.value.entityType.getIfSupported()!,
        new EntityViewerTabData(
            queryLanguage.value,
            entityViewerService.buildReferencedEntityFilterBy(queryLanguage.value as QueryLanguage, [primaryKey]),
            undefined,
            dataLocale?.value
        ),
        true
    ))
}
</script>

<template>
    <div class="reference-attributes">
        <VExpansionPanels class="pa-4 reference-attributes-renderer-reference-array">
            <VExpansionPanel v-for="reference of referencesWithAttributes" :key="reference.primaryKey">
                <VExpansionPanelTitle>
                    <VIcon class="mr-3">mdi-link-variant</VIcon>
                    <span>{{ reference.primaryKey }}</span>
                    <VSpacer/>
                    <div class="mr-2">
                        <VBtn icon variant="text" density="compact" @click="openReference(reference.primaryKey)">
                            <VIcon>mdi-open-in-new</VIcon>
                            <VTooltip activator="parent">
                                {{ t('entityViewer.grid.referenceAttributeRenderer.button.openReference') }}
                            </VTooltip>
                        </VBtn>
                    </div>
                </VExpansionPanelTitle>

                <VExpansionPanelText>
                    <VExpansionPanels>
                        <EntityGridCellDetailValueListItem
                            v-for="(representativeAttribute, index) of reference.representativeAttributes"
                            :key="index"
                            :value="representativeAttribute as EntityPropertyValue"
                            :component-data-type="attributeDataType"
                        />
                    </VExpansionPanels>
                </VExpansionPanelText>
            </VExpansionPanel>

        </VExpansionPanels>
    </div>
</template>

<style lang="scss" scoped>
.reference-attributes-renderer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem;

    h3 {
        margin-bottom: 1rem;
    }

    &-all-prices {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        &__filter {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        &__select {
            flex: 1;
            min-width: 10rem;
        }
    }
}

.reference-attributes-renderer-reference-array {
    :deep(.v-expansion-panel-text__wrapper) {
        padding: 0;
    }
}

.array-item__title {
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
    padding-right: 1rem;
}
</style>
