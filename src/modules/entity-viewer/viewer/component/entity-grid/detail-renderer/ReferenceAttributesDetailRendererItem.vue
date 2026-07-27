<script setup lang="ts">
/**
 * Single item in the reference-attribute column detail. Shows the referenced entity's primary key (hovering it
 * reveals the full `PK: target representative attributes` line for managed reference types), the referenced group's
 * primary key when present, and a preview of this column's attribute value. Expanding the item renders the attribute
 * value(s) through the shared value renderer (markdown/code). For managed reference types an action menu opens the
 * referenced entity, and — when the reference has a managed group — the referenced group, in a new grid.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import EntityGridCellDetailValueListItem
    from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCellDetailValueListItem.vue'

const { t } = useI18n()

const props = defineProps<{
    reference: EntityReferenceValue,
    attributeDataType: Scalar,
    managed: boolean,
    groupManaged: boolean
}>()
const emit = defineEmits<{
    (e: 'openEntity', primaryKey: number): void,
    (e: 'openGroup', groupPrimaryKey: number): void
}>()

const groupAvailable = computed<boolean>(() => props.reference.groupPrimaryKey != undefined)

function requestOpenGroup(): void {
    if (props.reference.groupPrimaryKey != undefined) {
        emit('openGroup', props.reference.groupPrimaryKey)
    }
}

const attributePreview = computed<string>(() =>
    props.reference.representativeAttributes.map(value => value.toPreviewString()).join(', '))
const targetTooltip = computed<string | undefined>(() =>
    props.reference.targetRepresentativeAttributes != undefined
        ? props.reference.toTargetPreviewString()
        : undefined)
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            <VIcon class="mr-3">mdi-link-variant</VIcon>
            <VTooltip v-if="targetTooltip">
                <template #activator="{ props: tooltipProps }">
                    <span class="reference-attribute-item__pk reference-attribute-item__pk--hoverable" v-bind="tooltipProps">
                        {{ reference.primaryKey }}
                    </span>
                </template>
                {{ targetTooltip }}
            </VTooltip>
            <span v-else class="reference-attribute-item__pk">{{ reference.primaryKey }}</span>
            <span v-if="groupAvailable" class="reference-attribute-item__group-pk">&nbsp;/ {{ reference.groupPrimaryKey }}</span>
            <span v-if="attributePreview" class="reference-attribute-item__value ml-3">{{ attributePreview }}</span>
            <VSpacer />
            <div v-if="managed && groupManaged" class="mr-2">
                <VMenu>
                    <template #activator="{ props: menuProps }">
                        <VBtn icon variant="text" density="compact" v-bind="menuProps" @click.stop>
                            <VIcon>mdi-open-in-new</VIcon>
                            <VTooltip activator="parent">
                                {{ t('entityViewer.grid.referenceAttributeRenderer.button.openReference') }}
                            </VTooltip>
                        </VBtn>
                    </template>
                    <template #default>
                        <VList>
                            <VListItem prepend-icon="mdi-open-in-new" @click="emit('openEntity', reference.primaryKey)">
                                {{ t('entityViewer.grid.referenceAttributeRenderer.button.openReferencedEntity') }}
                            </VListItem>
                            <VListItem
                                prepend-icon="mdi-open-in-new"
                                :disabled="!groupAvailable"
                                @click="requestOpenGroup"
                            >
                                {{ t('entityViewer.grid.referenceAttributeRenderer.button.openReferencedGroup') }}
                            </VListItem>
                        </VList>
                    </template>
                </VMenu>
            </div>
            <div v-else-if="managed" class="mr-2">
                <VBtn icon variant="text" density="compact" @click.stop="emit('openEntity', reference.primaryKey)">
                    <VIcon>mdi-open-in-new</VIcon>
                    <VTooltip activator="parent">
                        {{ t('entityViewer.grid.referenceAttributeRenderer.button.openReferencedEntity') }}
                    </VTooltip>
                </VBtn>
            </div>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
            <VExpansionPanels>
                <EntityGridCellDetailValueListItem
                    v-for="(attributeValue, index) of reference.representativeAttributes"
                    :key="index"
                    :value="attributeValue as EntityPropertyValue"
                    :component-data-type="attributeDataType"
                />
            </VExpansionPanels>
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>
.reference-attribute-item__pk {
    font-weight: 500;
    flex-shrink: 0;

    &--hoverable {
        text-decoration: underline dotted;
        cursor: help;
        // lift above the expansion-panel-title hover overlay so real pointer hover reaches the span
        // (the same reason the VBtn tooltip works); otherwise the overlay swallows mouseenter
        position: relative;
        z-index: 1;
    }
}

.reference-attribute-item__group-pk {
    font-weight: 500;
    opacity: 0.7;
    white-space: nowrap;
    flex-shrink: 0;
}

.reference-attribute-item__value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
