<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { useDataLocale, usePriceType } from '@/modules/entity-viewer/viewer/component/dependencies'
import { isLocalizedSchema } from '@/modules/database-driver/request-response/schema/LocalizedSchema'
import { isTypedSchema } from '@/modules/database-driver/request-response/schema/TypedSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue.ts'
import type { Predecessor } from '@/modules/database-driver/data-type/Predecessor.ts'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema.ts'

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
const prependIcon = computed<string | undefined>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity && props.propertyDescriptor?.key.name === StaticEntityProperties.ParentPrimaryKey) {
        return 'mdi-open-in-new'
    } else if (props.propertyDescriptor?.schema != undefined &&
        isTypedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.type === Scalar.Predecessor) {
        if (props.propertyValue instanceof Array)
            return undefined
        if (((props.propertyValue as NativeValue).value() as Predecessor).predecessorId === -1) {
            return 'mdi-ray-end-arrow'
        } else {
            return 'mdi-ray-start'
        }
    } else if (props.propertyDescriptor?.type === EntityPropertyType.References && props.propertyDescriptor.schema instanceof ReferenceSchema) {
        return 'mdi-open-in-new'
    } else
        return undefined
})
const showDetailOnHover = computed<boolean>(() => printablePropertyValue.value.length <= 100)

const noLocaleSelected = computed<boolean>(() => {
    return props.propertyDescriptor?.schema != undefined &&
        isLocalizedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.localized &&
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

function copyValue(raw: boolean): void {
    if (raw) {
        const entityValue: EntityPropertyValue | EntityPropertyValue[] | undefined = props.propertyValue
        if (entityValue) {
            let value: string = ''

            if (entityValue instanceof Array) {
                if (entityValue.length !== 0) {
                    value = `[${entityValue.map(it => it.toRawString()).join(', ')}]`
                }
            } else if (entityValue instanceof EntityPropertyValue) {
                value = entityValue.toRawString()
            }

            navigator.clipboard.writeText(value).then(() => {
                toaster.info(t('common.notification.copiedToClipboard')).then()
            }).catch(() => {
                toaster.error(t('common.notification.failedToCopyToClipboard')).then()
            })
        }
    } else {
        if (printablePropertyValue.value) {
            navigator.clipboard.writeText(printablePropertyValue.value).then(() => {
                toaster.info(t('common.notification.copiedToClipboard')).then()
            }).catch(() => {
                toaster.error(t('common.notification.failedToCopyToClipboard')).then()
            })
        }
    }
}

const tooltip = computed<string>(() => {
    if (props.propertyDescriptor?.schema != undefined &&
        isTypedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.type === Scalar.Predecessor
    ) {
        if (props.propertyValue instanceof NativeValue) {
            //Head
            if (((props.propertyValue as NativeValue).value() as Predecessor).predecessorId === -1) {
                return 'Head of the list.'
            } else {
                return 'Pointer to a previous entity in the list.'
            }
        } else {
            return printablePropertyValue.value
        }
    } else {
        return printablePropertyValue.value
    }
})

function handleClick(e: MouseEvent): void {
    e.preventDefault()

    if (e.shiftKey && e.button === 1) {
        copyValue(true)
    } else if (e.button === 1) {
        copyValue(false)
    } else if (e.button === 0) {
        emit('click')
    }
}
</script>

<template>
    <td class="data-grid-cell" :class="{ 'data-grid-cell--clickable': printablePropertyValue }"
        @mousedown="(e) => handleClick(e)">
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
                <VIcon v-if="prependIcon !== undefined" class="mr-1">{{ prependIcon }}</VIcon>
                <span class="inline-flex items-center">
                    {{ printablePropertyValue }}

                    <VTooltip
                        v-if="showDetailOnHover"
                        activator="parent"
                        location="bottom"
                        :interactive="true">
                        <div>
                            <VChip class="chip" size="small">
                                <span>{{ t('command.entityViewer.entityGrid.entityGridCell.copyValueToolTip') }}</span>
                                <span class="text-disabled ml-1">
                                    ({{ t('command.entityViewer.entityGrid.entityGridCell.copyValueToolTipDescription') }})
                                </span>
                            </VChip>
                            <VChip class="chip" size="small">
                                <span>{{ t('command.entityViewer.entityGrid.entityGridCell.rawCopyToolTip') }}</span>
                                <span class="text-disabled ml-1">
                                    ({{ t('command.entityViewer.entityGrid.entityGridCell.rawCopyToolTipDescription') }})
                                </span>
                            </VChip>
                        </div>
                        <hr />
                        <p>{{ tooltip }}</p>
                    </VTooltip>
                </span>
            </template>
        </span>
    </td>
</template>

<style scoped lang="scss">
td.data-grid-cell {
    height: 2.25rem;
    line-height: 2.25rem;
    padding: 0 .75rem;
    position: relative;
    overflow-x: clip;
}

.data-grid-cell--clickable {
    cursor: pointer;

    &:hover {
        background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
    }
}

.data-grid-cell__body {
    display: inline-flex;
    align-items: center;
    position: absolute;
    inset: 0;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-left: 16px;
    margin-right: 16px;
}

.chip {
    margin: 5px;
}

hr {
    margin: 5px;
    border: none;
    height: 1px;
    max-height: 1.5px;

    background-color: rgba(255, 255, 255, 0.3);

    border-radius: 9999px;
}
 p{
     margin: 10px;
 }
</style>
