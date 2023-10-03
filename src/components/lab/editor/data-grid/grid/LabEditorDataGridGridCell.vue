<script setup lang="ts">
import { EntityPropertyDescriptor, EntityPropertyType, StaticEntityProperties } from '@/model/editor/data-grid'
import { computed } from 'vue'

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    dataLocale: string | undefined,
    propertyValue: any
}>()
const emit = defineEmits<{
    (e: 'click'): void
}>()

const printablePropertyValue = computed<string>(() => toPrintablePropertyValue(props.propertyValue))
const openableInNewTab = computed<boolean>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity && props.propertyDescriptor?.key.name === StaticEntityProperties.ParentPrimaryKey) {
        return true
    } else if (props.propertyDescriptor?.schema?.referencedEntityType) {
        return true
    } else {
        return false
    }
})

function toPrintablePropertyValue(value: any): string {
    if (value == undefined) {
        return ''
    }
    if (value instanceof Array) {
        if (value.length === 0) {
            return ''
        }
        return `[${value.map(it => toPrintablePropertyValue(it)).join(', ')}]`
    } else if (value instanceof Object) {
        return JSON.stringify(value)
    } else {
        return value.toString()
    }
}
</script>

<template>
    <td
        :class="{'data-grid-cell--clickable': printablePropertyValue}"
        @click="emit('click')"
    >
        <span class="data-grid-cell__body">
            <template v-if="propertyDescriptor?.schema?.localized && !dataLocale">
                <span class="text-disabled">&lt;no locale selected&gt;</span>
            </template>
            <template v-else-if="propertyValue instanceof Array && propertyValue.length === 0">
                <span class="text-disabled">&lt;empty array&gt;</span>
            </template>
            <template v-else-if="!propertyValue">
                <span class="text-disabled">&lt;null&gt;</span>
            </template>
            <template v-else>
                <VIcon v-if="openableInNewTab">mdi-open-in-new</VIcon>
                {{ printablePropertyValue }}
            </template>
        </span>
    </td>
</template>

<style lang="scss" scoped>
.data-grid-cell {
    &--clickable {
        cursor: pointer;

        &:hover {
            background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
        }
    }

    &__body {
        line-height: 2.25rem;
        overflow-x: hidden;
        overflow-y: hidden;
        display: block;
        min-width: 5rem;
        max-width: 15rem;
        height: 2.25rem;
        text-overflow: clip;
        text-wrap: nowrap;
    }
}
</style>
