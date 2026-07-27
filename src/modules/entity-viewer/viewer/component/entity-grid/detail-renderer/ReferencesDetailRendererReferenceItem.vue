<script setup lang="ts">
/**
 * Single reference item in the references column detail. Shows the referenced entity's primary key (and the referenced
 * group's primary key when present) together with its representative attributes. For managed reference types an action
 * menu opens the referenced entity, and — when the reference has a managed group — the referenced group, in a new grid.
 * Expanding the item lists the target entity's representative attributes in a properties table.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import VPropertiesTable from '@/modules/base/component/VPropertiesTable.vue'

const { t } = useI18n()

const props = defineProps<{
    reference: EntityReferenceValue,
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

const targetAttributes = computed<[string, string][]>(() => {
    const attributes: [string, string][] = []
    if (props.reference.targetRepresentativeAttributes != undefined) {
        for (const [name, value] of props.reference.targetRepresentativeAttributes) {
            attributes.push([name, value.toPreviewString()])
        }
    }
    return attributes
})
const titleValues = computed<string>(() => targetAttributes.value.map(([, value]) => value).join(', '))
const properties = computed<Property[]>(() =>
    targetAttributes.value.map(([name, value]) => new Property(name, new PropertyValue(value)))
)
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            <VIcon class="mr-3">mdi-link-variant</VIcon>
            <span class="reference-item__pk">{{ reference.primaryKey }}</span>
            <span v-if="groupAvailable" class="reference-item__group-pk">&nbsp;/ {{ reference.groupPrimaryKey }}</span>
            <span v-if="titleValues" class="reference-item__values ml-3">{{ titleValues }}</span>
            <VSpacer />
            <div v-if="managed && groupManaged" class="mr-2">
                <VMenu>
                    <template #activator="{ props: menuProps }">
                        <VBtn icon variant="text" density="compact" v-bind="menuProps" @click.stop>
                            <VIcon>mdi-open-in-new</VIcon>
                            <VTooltip activator="parent">
                                {{ t('entityViewer.grid.referencesRenderer.button.openReference') }}
                            </VTooltip>
                        </VBtn>
                    </template>
                    <template #default>
                        <VList>
                            <VListItem prepend-icon="mdi-open-in-new" @click="emit('openEntity', reference.primaryKey)">
                                {{ t('entityViewer.grid.referencesRenderer.button.openReferencedEntity') }}
                            </VListItem>
                            <VListItem
                                prepend-icon="mdi-open-in-new"
                                :disabled="!groupAvailable"
                                @click="requestOpenGroup"
                            >
                                {{ t('entityViewer.grid.referencesRenderer.button.openReferencedGroup') }}
                            </VListItem>
                        </VList>
                    </template>
                </VMenu>
            </div>
            <div v-else-if="managed" class="mr-2">
                <VBtn icon variant="text" density="compact" @click.stop="emit('openEntity', reference.primaryKey)">
                    <VIcon>mdi-open-in-new</VIcon>
                    <VTooltip activator="parent">
                        {{ t('entityViewer.grid.referencesRenderer.button.openReferencedEntity') }}
                    </VTooltip>
                </VBtn>
            </div>
        </VExpansionPanelTitle>

        <VExpansionPanelText v-if="properties.length > 0">
            <VPropertiesTable :properties="properties" />
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>
.reference-item__pk {
    font-weight: 500;
    flex-shrink: 0;
}

.reference-item__group-pk {
    font-weight: 500;
    opacity: 0.7;
    white-space: nowrap;
    flex-shrink: 0;
}

.reference-item__values {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
