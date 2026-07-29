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

defineProps<{
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
    <!--
        the color is passed twice on purpose: inside a VChipGroup (the List<PropertyValue> variant) Vuetify
        applies `color` only to selected chips and falls back to `base-color`, while outside a group
        `color` wins - and the global VChip default would otherwise override the base color there
    -->
    <VChip
        v-else-if="propertyValue.value instanceof KeywordValue"
        :variant="propertyValue.action ? 'outlined' : 'plain'"
        :color="propertyValue.value?.color"
        :base-color="propertyValue.value?.color"
        dense
        @click="propertyValue.action?.(propertyValue.value!.value)"
    >
        {{ propertyValue.value.value }}
        <VTooltip v-if="propertyValue.value.tooltip" activator="parent">
            {{ propertyValue.value.tooltip }}
        </VTooltip>
    </VChip>

    <!-- actual value is multi-value flag -->
    <VChip
        v-else-if="propertyValue.value instanceof MultiValueFlagValue"
        :prepend-icon="propertyValue.value.icon ? propertyValue.value.icon : ( propertyValue.value.value ? 'mdi-check' : 'mdi-close')"
        :variant="propertyValue.action ? 'outlined' : 'plain'"
        dense
        @click="propertyValue.action?.(propertyValue.value.valueSpecification)"
    >
        {{ propertyValue.value.valueSpecification }}

        <VTooltip v-if="propertyValue.value.description || propertyValue.value.descriptionMarkup" activator="parent">
            <template v-if="propertyValue.value.descriptionMarkup">
                <VMarkdown :source="propertyValue.value.descriptionMarkup" />
            </template>
            <template v-else>
                {{ propertyValue.value.description }}
            </template>
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
    <div v-if="propertyValue.note" class="value-note">
        <VIcon icon="mdi-alert-outline" color="warning" />
        <VTooltip activator="parent">
            <span>{{ propertyValue.note }}</span>
        </VTooltip>
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
// the note sits next to the value it annotates - as a flex item among chips it has to center itself on
// their line, otherwise the icon (24px) rides above the chips (32px). Spacing on the left already comes
// from the annotated chip's own margin, so only the trailing gap has to be added to keep the note evenly
// spaced between its value and whatever follows.
.value-note {
    display: inline-flex;
    align-items: center;
    align-self: center;
    margin-right: 0.5rem;
}

.text-item {
    // seems like hack to keep markdown text from overflowing outside of the table
    overflow-wrap: anywhere;

    // markdown blocks carry trailing margins that would make text rows sit lower than chip rows
    :deep(.md-content) > :last-child {
        margin-bottom: 0;
    }
}
</style>
