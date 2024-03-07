<script setup lang="ts">
import {
    dataLocaleKey,
    EntityPropertyDescriptor,
    EntityPropertyType, EntityPropertyValue, priceTypeKey,
    StaticEntityProperties
} from '@/model/editor/tab/dataGrid/data-grid'
import { computed, inject } from 'vue'
import { Scalar } from '@/model/evitadb'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'

const toaster: Toaster = useToaster()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: EntityPropertyValue | EntityPropertyValue[] | undefined
}>()
const emit = defineEmits<{
    (e: 'click'): void
}>()
const dataLocale = inject(dataLocaleKey)
const priceType = inject(priceTypeKey)

const printablePropertyValue = computed<string>(() => toPrintablePropertyValue(props.propertyValue))
const openableInNewTab = computed<boolean>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity && props.propertyDescriptor?.key.name === StaticEntityProperties.ParentPrimaryKey) {
        return true
    } else if (props.propertyDescriptor?.type === EntityPropertyType.Attributes && props.propertyDescriptor.schema.type === Scalar.Predecessor) {
        return true
    } else if (props.propertyDescriptor?.type === EntityPropertyType.AssociatedData && props.propertyDescriptor.schema.type === Scalar.Predecessor) {
        return true
    } else if (props.propertyDescriptor?.schema?.referencedEntityType) {
        return true
    } else {
        return false
    }
})
const showDetailOnHover = computed<boolean>(() => printablePropertyValue.value.length <= 100)

// todo lho we could format certain data types more human readable like we do in markdown pretty printer
function toPrintablePropertyValue(value: EntityPropertyValue | EntityPropertyValue[] | undefined): string {
    if (value == undefined) {
        return ''
    }
    if (value instanceof Array) {
        if (value.length === 0) {
            return ''
        }
        return `[${value.map(it => toPrintablePropertyValue(it)).join(', ')}]`
    } else if (value instanceof EntityPropertyValue) {
        const previewString = value.toPreviewString({ priceType: priceType?.value })
        if (previewString == undefined) {
            return ''
        }
        return previewString
    } else {
        throw new UnexpectedError(undefined, 'Unexpected property value type: ' + typeof value)
    }
}

function copyValue(): void {
    if (printablePropertyValue.value) {
        navigator.clipboard.writeText(printablePropertyValue.value).then(() => {
            toaster.info('Copied to clipboard.')
        }).catch(() => {
            toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
        })
    }
}
</script>

<template>
    <td
        :class="{'data-grid-cell--clickable': printablePropertyValue}"
        @click="emit('click')"
        @click.middle="copyValue"
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
                <VIcon v-if="openableInNewTab" class="mr-1">mdi-open-in-new</VIcon>
                <span>
                    {{ printablePropertyValue }}
                    <VTooltip v-if="showDetailOnHover" activator="parent">
                        {{ printablePropertyValue }}
                    </VTooltip>
                </span>
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
