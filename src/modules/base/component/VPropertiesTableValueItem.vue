<script setup lang="ts">
/**
 * Renders the PropertyValue variant
 */

import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import { MultiValueFlagValue } from '@/modules/base/model/properties-table/MultiValueFlagValue'
import { NotApplicableValue } from '@/modules/base/model/properties-table/NotApplicableValue'
import { RangeValue } from '@/modules/base/model/properties-table/RangeValue'
import { useI18n } from 'vue-i18n'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { ProgressValue } from '@/modules/base/model/properties-table/ProgressValue'
import { PlaceholderValue } from '@/modules/base/model/properties-table/PlaceholderValue'

const { t } = useI18n()

const props = defineProps<{
    property: Property,
    propertyValue: PropertyValue
}>()
</script>

<template>
    <!-- missing actual value -->
    <span
        v-if="propertyValue.value == undefined"
        class="text-disabled font-weight-light font-italic"
    >
        {{ t('common.placeholder.empty') }}
    </span>

    <!-- actual value is string -->
    <div v-else-if="typeof propertyValue.value === 'string'" class="text-item">
        <VMarkdown :source="propertyValue.value.toString()"/>
    </div>

    <!-- actual value is boolean -->
    <VCheckbox
        v-else-if="typeof propertyValue.value === 'boolean'"
        :model-value="propertyValue.value"
        disabled
        density="compact"
        hide-details
        class="flex-grow-0"
        @click="propertyValue.action?.(undefined)"
    />

    <!-- actual value is keyword -->
    <VChip
        v-else-if="propertyValue.value instanceof KeywordValue"
        :variant="propertyValue.action ? 'outlined' : 'plain'"
        :color="propertyValue.value.color"
        dense
        @click="propertyValue.action?.(propertyValue.value!.value)"
    >
        {{ propertyValue.value.value }}
    </VChip>

    <!-- actual value is multi-value flag -->
    <VChip
        v-else-if="propertyValue.value instanceof MultiValueFlagValue"
        :prepend-icon="propertyValue.value.value ? 'mdi-check' : 'mdi-checkbox-blank-outline'"
        :variant="propertyValue.action ? 'outlined' : 'plain'"
        dense
        @click="propertyValue.action?.(propertyValue.value.valueSpecification)"
    >
        {{ propertyValue.value.valueSpecification }}

        <VTooltip v-if="propertyValue.value.description" activator="parent">
            {{ propertyValue.value.description }}
        </VTooltip>
    </VChip>

    <!-- actual value is not-applicable value -->
    <div v-else-if="propertyValue.value instanceof NotApplicableValue" class="d-flex align-center">
        <VCheckbox
            :model-value="false"
            disabled
            false-icon="mdi-checkbox-blank-off-outline"
            density="compact"
            hide-details
            class="flex-grow-0"
            @click="propertyValue.action?.(undefined)"
        />

        <span v-if="propertyValue.value.explanation" class="ml-2">
            <VIcon icon="mdi-information-outline" />
            <VTooltip activator="parent">
                <span>{{ propertyValue.value.explanation }}</span>
            </VTooltip>
        </span>
    </div>

    <!-- actual value is range value -->
    <div v-else-if="propertyValue.value instanceof RangeValue">
        {{ propertyValue.value.toSerializable()[0] }}
        &nbsp;-&nbsp;
        {{ propertyValue.value.toSerializable()[1] }}
    </div>

    <div
        v-else-if="propertyValue.value instanceof ProgressValue"
        class="progress-bar-container"
    >
        <VProgressLinear
            :model-value="propertyValue.value.progress"
            :indeterminate="propertyValue.value.indeterminate"
        />
        <div v-if="!propertyValue.value.indeterminate" class="progress-bar-value">
            {{ propertyValue.value.progress }} %
        </div>
    </div>

    <span
        v-else-if="propertyValue.value instanceof PlaceholderValue"
        class="text-disabled font-weight-light font-italic"
    >
        {{ propertyValue.value.value }}
    </span>

    <!-- actual value is something else (number) -->
    <span v-else>
        {{ propertyValue.value.toString() }}
    </span>

    <!-- side note for the value -->
    <div v-if="propertyValue.note">
        <span class="ml-2">
            <VIcon icon="mdi-alert-outline" color="warning" />
            <VTooltip activator="parent">
                <span>{{ propertyValue.note }}</span>
            </VTooltip>
        </span>
    </div>
</template>

<style lang="scss" scoped>
.progress-bar-container {
    display: inline-grid;
    grid-template-columns: 10rem min-content;
    gap: 0.5rem;
    align-items: center;
}
.progress-bar-value {
    text-wrap: nowrap;
}
.text-item {
    // seems like hack to keep markdown text from overflowing outside of the table
    overflow-wrap: anywhere;
}
</style>
