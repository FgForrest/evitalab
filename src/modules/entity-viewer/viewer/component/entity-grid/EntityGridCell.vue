<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { useDataLocale, usePriceType } from '@/modules/entity-viewer/viewer/component/dependencies'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { isLocalizedSchema } from '@/modules/connection/model/schema/LocalizedSchema'
import { isTypedSchema } from '@/modules/connection/model/schema/TypedSchema'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: EntityPropertyValue | EntityPropertyValue[] | undefined
}>()
const emit = defineEmits<{
    (e: 'click'): void
}>()
const dataLocale = useDataLocale()
const priceType = usePriceType()

const printablePropertyValue = computed<string>(() => toPrintablePropertyValue(props.propertyValue))
const openableInNewTab = computed<boolean>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity && props.propertyDescriptor?.key.name === StaticEntityProperties.ParentPrimaryKey) {
        return true
    } else if (props.propertyDescriptor?.schema != undefined &&
        isTypedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.type.getIfSupported()! === Scalar.Predecessor) {
        return true
    } else if (props.propertyDescriptor?.type === EntityPropertyType.References && props.propertyDescriptor.schema instanceof ReferenceSchema) {
        return true
    } else {
        return false
    }
})
const showDetailOnHover = computed<boolean>(() => printablePropertyValue.value.length <= 100)

const noLocaleSelected = computed<boolean>(() => {
    return props.propertyDescriptor?.schema != undefined &&
        isLocalizedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.localized.getOrElse(false) &&
        dataLocale.value == undefined
})
const emptyArray = computed<boolean>(() => {
    return props.propertyValue instanceof Array && props.propertyValue.length === 0
})
const nullValue = computed<boolean>(() => {
    return props.propertyValue == undefined
})

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
        const previewString = value.toPrettyPrintString({ priceType: priceType?.value })
        if (previewString == undefined) {
            return ''
        }
        return previewString
    } else {
        throw new UnexpectedError('Unexpected property value type: ' + typeof value)
    }
}

function copyValue(): void {
    if (printablePropertyValue.value) {
        navigator.clipboard.writeText(printablePropertyValue.value).then(() => {
            toaster.info(t('common.notification.copiedToClipboard'))
        }).catch(() => {
            toaster.error(new UnexpectedError(t('common.notification.failedToCopyToClipboard')))
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
            <template v-if="noLocaleSelected">
                <span class="text-disabled">{{ t('entityViewer.grid.cell.placeholder.noLocaleSelected') }}</span>
            </template>
            <template v-else-if="emptyArray">
                <span class="text-disabled">{{ t('common.placeholder.emptyArray') }}</span>
            </template>
            <template v-else-if="nullValue">
                <span class="text-disabled">{{ t('common.placeholder.null') }}</span>
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
