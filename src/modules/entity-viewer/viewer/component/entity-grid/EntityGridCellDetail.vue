<script setup lang="ts">
/**
 * Shows details of an entity property (table cell content) in the LabEditorDataGridGrid component.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import {
    EntityPropertyValueDesiredOutputFormat
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueDesiredOutputFormat'
import { ExtraEntityObjectType } from '@/modules/entity-viewer/viewer/model/ExtraEntityObjectType'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import VCardTitleWithActions from '@/modules/base/component/VCardTitleWithActions.vue'
import DetailOutputFormatSelector
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/DetailOutputFormatSelector.vue'
import DelegateDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/DelegateDetailRenderer.vue'
import EntityGridCellDetailValueListItem
    from '@/modules/entity-viewer/viewer/component/entity-grid/EntityGridCellDetailValueListItem.vue'
import {
    provideEntityPropertyDescriptor,
    provideSelectedEntity
} from '@/modules/entity-viewer/viewer/component/dependencies'
import { isTypedSchema } from '@/modules/connection/model/schema/TypedSchema'

const { t } = useI18n()

const props = defineProps<{
    modelValue: boolean,
    entity: FlatEntity,
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: EntityPropertyValue | EntityPropertyValue[] | undefined
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()
provideSelectedEntity(props.entity)
provideEntityPropertyDescriptor(props.propertyDescriptor)

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
            case StaticEntityProperties.Version: return Scalar.Integer
            case StaticEntityProperties.Locales: return Scalar.LocaleArray
            case StaticEntityProperties.PriceInnerRecordHandling: return Scalar.String
            default: return undefined
        }
    } else if (props.propertyDescriptor?.type === EntityPropertyType.Prices) {
        return ExtraEntityObjectType.Prices
    } else if (props.propertyDescriptor?.type === EntityPropertyType.ReferenceAttributes) {
        return ExtraEntityObjectType.ReferenceAttributes
    } else if (props.propertyDescriptor?.schema != undefined && isTypedSchema(props.propertyDescriptor.schema)) {
        return props.propertyDescriptor.schema.type.getIfSupported()!
    } else {
        return undefined
    }
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
                <span>{{ propertyDescriptor?.flattenedTitle || t('entityViewer.grid.cell.detail.placeholder.unknownProperty') }}</span>
            </template>
            <template #actions>
                <DetailOutputFormatSelector
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
                        {{ t('common.button.close') }}
                    </VTooltip>
                </VBtn>
            </template>
        </VCardTitleWithActions>
        <VDivider />
        <VCardText class="data-grid-cell-detail__body">
            <DelegateDetailRenderer
                v-if="!isArray"
                :data-type="componentDataType"
                :value="propertyValue as EntityPropertyValue"
                :output-format="globalOutputFormat"
            />

            <VExpansionPanels
                v-else
                multiple
                class="pa-4 data-grid-cell-detail-array"
            >
                <EntityGridCellDetailValueListItem
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
