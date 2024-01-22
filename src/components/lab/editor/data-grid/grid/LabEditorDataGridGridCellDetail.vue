<script setup lang="ts">
/**
 * Shows details of an entity property (table cell content) in the LabEditorDataGridGrid component.
 */

import VCardTitleWithActions from '@/components/base/VCardTitleWithActions.vue'
import {
    EntityPropertyDescriptor, entityPropertyDescriptorKey,
    EntityPropertyType,
    EntityPropertyValue,
    EntityPropertyValueDesiredOutputFormat,
    ExtraEntityObjectType,
    FlatEntity, selectedEntityKey,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { computed, provide, ref } from 'vue'
import LabEditorDataGridGridCellDetailDelegateRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailDelegateRenderer.vue'
import { Scalar } from '@/model/evitadb'
import LabEditorDataGridGridDetailValueListItem
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridDetailValueListItem.vue'
import LabEditorDataGridGridCellDetailOutputFormatSelector
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailOutputFormatSelector.vue'

const props = defineProps<{
    modelValue: boolean,
    entity: FlatEntity,
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: EntityPropertyValue | EntityPropertyValue[] | undefined
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()
provide(selectedEntityKey, props.entity)
provide(entityPropertyDescriptorKey, props.propertyDescriptor)

const headerPrependIcon = computed<string | undefined>(() => {
    const propertyType: EntityPropertyType | undefined = props.propertyDescriptor?.type
    if (propertyType === EntityPropertyType.AssociatedData) {
        return 'mdi-package-variant-closed'
    }
    if (propertyType === EntityPropertyType.References) {
        return 'mdi-link-variant'
    }
    return undefined
})

const globalOutputFormat = ref<EntityPropertyValueDesiredOutputFormat>(EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint)

const rawDataType = computed<Scalar | ExtraEntityObjectType | undefined>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity) {
        const propertyName = props.propertyDescriptor.key.name
        switch (propertyName) {
            case StaticEntityProperties.PrimaryKey: return Scalar.Integer
            case StaticEntityProperties.Locales:
            case StaticEntityProperties.AllLocales: return Scalar.LocaleArray
            case StaticEntityProperties.PriceInnerRecordHandling: return Scalar.String
            default: return undefined
        }
    } else if (props.propertyDescriptor?.type === EntityPropertyType.Prices) {
        return ExtraEntityObjectType.Prices
    } else if (props.propertyDescriptor?.type === EntityPropertyType.ReferenceAttributes) {
        return ExtraEntityObjectType.ReferenceAttributes
    }
    return props.propertyDescriptor?.schema?.type
})
const isArray = computed<boolean>(() => rawDataType?.value?.endsWith('Array') || false)
const componentDataType = computed<Scalar | ExtraEntityObjectType | undefined>(() => {
    if (!rawDataType.value) {
        return undefined
    }
    if (isArray.value) {
        return (rawDataType.value as string).replace('Array', '') as Scalar | ExtraEntityObjectType
    } else {
        return rawDataType.value as Scalar | ExtraEntityObjectType
    }
})

</script>

<template>
    <VCard class="data-grid-cell-detail">
        <VCardTitleWithActions>
            <template #default>
                <VIcon
                    v-if="headerPrependIcon"
                    class="mr-2"
                >
                    {{ headerPrependIcon }}
                </VIcon>
                <span>{{ propertyDescriptor?.flattenedTitle || 'Unknown property' }}</span>
            </template>
            <template #actions>
                <LabEditorDataGridGridCellDetailOutputFormatSelector
                    v-if="!isArray"
                    v-model="globalOutputFormat"
                />
                <VBtn
                    icon
                    variant="flat"
                    density="compact"
                    @click="emit('update:modelValue', false)"
                >
                    <VIcon>mdi-close</VIcon>
                    <VTooltip activator="parent">
                        Close detail
                    </VTooltip>
                </VBtn>
            </template>
        </VCardTitleWithActions>
        <VDivider />
        <VCardText class="data-grid-cell-detail__body">
            <LabEditorDataGridGridCellDetailDelegateRenderer
                v-if="!isArray"
                :data-type="componentDataType"
                :value="propertyValue as EntityPropertyValue"
                :output-format="globalOutputFormat"
            />

            <VExpansionPanels
                v-else
                variant="accordion"
                multiple
                class="pa-4 data-grid-cell-detail-array"
            >
                <LabEditorDataGridGridDetailValueListItem
                    v-for="(value, index) of propertyValue"
                    :key="index"
                    :value="value as EntityPropertyValue"
                    :component-data-type="componentDataType as Scalar"
                />
            </VExpansionPanels>
        </VCardText>
    </VCard>
</template>

<style lang="scss" scoped>
.data-grid-cell-detail {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;

    &__body {
        position: relative;
        height: calc(100% - 3rem);
        overflow-x: auto;
        padding: 0;
    }
}

.data-grid-cell-detail-array {
    :deep(.v-expansion-panel-text__wrapper) {
        padding: 0;
    }
}
</style>
