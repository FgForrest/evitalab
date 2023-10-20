<script setup lang="ts">
/**
 * Shows details of an entity property (table cell content) in the LabEditorDataGridGrid component.
 */

import VCardTitleWithActions from '@/components/base/VCardTitleWithActions.vue'
import {
    EntityPropertyDescriptor,
    EntityPropertyType,
    EntityPropertyValueDesiredOutputFormat, StaticEntityProperties
} from '@/model/editor/data-grid'
import { computed, ref } from 'vue'
import LabEditorDataGridGridCellDetailDelegateRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailDelegateRenderer.vue'
import { Scalar } from '@/model/evitadb'
import LabEditorDataGridGridDetailValueListItem
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridDetailValueListItem.vue'
import LabEditorDataGridGridCellDetailOutputFormatSelector
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailOutputFormatSelector.vue'

const props = defineProps<{
    modelValue: boolean,
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: any
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

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

const rawDataType = computed<string | undefined>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity) {
        const propertyName = props.propertyDescriptor.key.name
        switch (propertyName) {
            case StaticEntityProperties.PrimaryKey: return Scalar.Integer
            case StaticEntityProperties.Locales:
            case StaticEntityProperties.AllLocales: return Scalar.LocaleArray
            case StaticEntityProperties.PriceInnerRecordHandling: return Scalar.String
            default: return undefined
        }
    }
    return props.propertyDescriptor?.schema?.type
})
const isArray = computed<boolean>(() => rawDataType?.value?.endsWith('Array') || false)
const componentDataType = computed<Scalar | undefined>(() => {
    if (!rawDataType.value) {
        return undefined
    }
    if (isArray.value) {
        return (rawDataType.value as string).replace('Array', '') as Scalar
    } else {
        return rawDataType.value as Scalar
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
                <span>{{ propertyDescriptor?.title || 'Unknown property' }}</span>
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
                :value="propertyValue"
                :output-format="globalOutputFormat"
            />

            <VExpansionPanels
                v-else
                variant="accordion"
                multiple
                class="pa-4"
            >
                <LabEditorDataGridGridDetailValueListItem
                    v-for="(value, index) of propertyValue"
                    :key="index"
                    :value="value"
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

.array-item__title {
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
    padding-right: 1rem;
}
.array-item__content {
    position: relative;
}

:deep(.v-expansion-panel-text__wrapper) {
    padding: 0;
}
</style>
