<script setup lang="ts">
import {
    EntityPropertyDescriptor,
    EntityPropertyType,
    EntityReferenceValue,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { computed } from 'vue'
import { Scalar } from '@/model/evitadb'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'

const toaster: Toaster = useToaster()

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
function toPrintablePropertyValue(value: any): string {
    if (value == undefined) {
        return ''
    }
    if (value instanceof Array) {
        if (value.length === 0) {
            return ''
        }
        return `[${value.map(it => toPrintablePropertyValue(it)).join(', ')}]`
    } else if (value instanceof EntityReferenceValue) {
        const flattenedRepresentativeAttributes: string[] = []
        for (const representativeAttribute of value.representativeAttributes) {
            if (representativeAttribute instanceof Array) {
                flattenedRepresentativeAttributes.push(...(representativeAttribute.map(it => toPrintablePropertyValue(it))))
            } else {
                flattenedRepresentativeAttributes.push(toPrintablePropertyValue(representativeAttribute))
            }
        }
        if (flattenedRepresentativeAttributes.length === 0) {
            return `${value.primaryKey}`
        } else {
            return `${value.primaryKey}: ${flattenedRepresentativeAttributes.join(', ')}`
        }
    } else if (value instanceof Object) {
        return JSON.stringify(value)
    } else {
        return value.toString()
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
