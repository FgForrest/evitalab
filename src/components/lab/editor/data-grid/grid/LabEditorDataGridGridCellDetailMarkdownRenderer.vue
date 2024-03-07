<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value as Markdown.
 */

import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'
import LabEditorDataGridGridCellDetailValueRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailValueRenderer.vue'
import VMarkdown from '@/components/base/VMarkdown.vue'
import { computed, ref } from 'vue'
import { BigDecimal, DateTime, Long, Range, Scalar } from '@/model/evitadb'
import { EntityPropertyValue, ExtraEntityObjectType, NativeValue } from '@/model/editor/tab/dataGrid/data-grid'

const toaster: Toaster = useToaster()

const whiteSpacePattern = /\s+/

const offsetDateTimeFormatter = new Intl.DateTimeFormat([], { dateStyle: "medium", timeStyle: "long" })
const localDateTimeFormatter = new Intl.DateTimeFormat([], { dateStyle: 'medium', timeStyle: "medium" })
const localDateFormatter = new Intl.DateTimeFormat([], { dateStyle: "medium" })
const localTimeFormatter = new Intl.DateTimeFormat([], { timeStyle: "medium" })

enum ActionType {
    Copy = 'copy',
    PrettyPrint = 'pretty-print'
}

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    dataType: Scalar | ExtraEntityObjectType | undefined,
    fillSpace?: boolean
}>(), {
    fillSpace: true
})

const prettyPrint = ref<boolean>(true)
const actions = computed(() => {
    return [
        {
            title: 'Copy',
            value: ActionType.Copy,
            props: {
                prependIcon: 'mdi-content-copy'
            }
        },
        {
            title: prettyPrint.value ? 'Display raw value' : 'Pretty print value',
            value: ActionType.PrettyPrint,
            props: {
                prependIcon: prettyPrint.value ? 'mdi-raw' : 'mdi-auto-fix'
            }
        }
    ]
})
const formattedValue = computed<string>(() => {
    if (!prettyPrint.value || !props.dataType || (props.value instanceof EntityPropertyValue && props.value.isEmpty())) {
        return props.value instanceof Array ? `[${props.value.map(it => it.toPreviewString()).join(', ')}]` : (props.value as EntityPropertyValue).toPreviewString()
    }
    try {

        switch (props.dataType) {
            case Scalar.String: {
                const stringValue: string = ((props.value as EntityPropertyValue).value() as string).trim()
                if (stringValue.startsWith('{') || stringValue.startsWith('[')) {
                    // probably JSON
                    return '```json\r\n' + stringValue + "\r\n```"
                } else if (stringValue.startsWith('<')) {
                    // probably XML or its derivative
                    return '```xml\r\n' + stringValue + '\r\n```'
                } else if (!whiteSpacePattern.test(stringValue)) {
                    // no white-space, so it's probably identifier (e.g., enum item)
                    return '`' + stringValue + '`'
                } else {
                    // regular text or something we don't support yet
                    return stringValue
                }
            }
            case Scalar.Byte:
            case Scalar.Short:
            case Scalar.Integer:
            case Scalar.Long:
            case Scalar.Boolean:
            case Scalar.Character:
            case Scalar.BigDecimal:
            case Scalar.UUID:
                return '`' + (props.value as EntityPropertyValue).value().toString() + '`'
            case Scalar.OffsetDateTime:
                return '📅 `' + offsetDateTimeFormatter.format(new Date((props.value as EntityPropertyValue).value().toString())) + '`'
            case Scalar.LocalDateTime:
                return '📅 `' + localDateTimeFormatter.format(new Date((props.value as EntityPropertyValue).value().toString())) + '`'
            case Scalar.LocalDate:
                return '📅 `' + localDateFormatter.format(new Date((props.value as EntityPropertyValue).value().toString())) + '`'
            case Scalar.LocalTime:
                return '📅 `' + localTimeFormatter.format(new Date('1970-01-01' + (props.value as EntityPropertyValue).value().toString())) + '`'
            case Scalar.DateTimeRange:
                return prettyPrintRangeValue(
                    props.value,
                    '📅 ',
                    (end: any): string => {
                        let year: number = parseInt((end as DateTime).split("-")[0])
                        if (year < -9999 || year > 9999) {
                            // apparently, if the year has more than 4 digits, it must be prefixed with a plus or minus sign
                            return '∞'
                        }
                        return offsetDateTimeFormatter.format(new Date(end.toString()))
                    }
                )
            case Scalar.ByteNumberRange:
            case Scalar.ShortNumberRange:
            case Scalar.IntegerNumberRange:
                return prettyPrintRangeValue(
                    props.value,
                    '',
                    (end: any): string => end.toString()
                )
            case Scalar.BigDecimalNumberRange:
            case Scalar.LongNumberRange:
                return prettyPrintRangeValue(
                    props.value,
                    '',
                    (end: any): string => end.toString()
                )
            case Scalar.Locale:
                return '🌐 `' + (props.value as EntityPropertyValue).value().toString() + '`'
            case Scalar.Currency:
                return '💰 `' + (props.value as EntityPropertyValue).value().toString() + '`'
            case Scalar.Predecessor:
                return '↻ `' + (props.value as EntityPropertyValue).value().toString() + '`'
            case Scalar.ComplexDataObject:
            case ExtraEntityObjectType.Prices:
            case ExtraEntityObjectType.ReferenceAttributes:
                return '```json\r\n' + JSON.stringify((props.value as EntityPropertyValue).value(), null, 2) + '\r\n```'
            default:
                return props.value instanceof Array ? `[${props.value.map(it => it.toPreviewString()).join(', ')}]` : (props.value as EntityPropertyValue).toPreviewString()
        }
    } catch (e) {
        console.error(e)
        return 'Invalid value.'
    }
})

function prettyPrintRangeValue(rawRange: any, prefix: string, endPrettyPrinter: (end: DateTime | BigDecimal | Long | number) => string): string {
    let from: any
    let to: any

    if (rawRange instanceof Array) {
        // range represented as direct array, this happens when the data type of attribute is a single range

        if (rawRange.length !== 2) {
            throw new UnexpectedError(undefined, `Invalid DateTimeRange value. Expected array with 2 elements, got ${rawRange.length}.`)
        }

        const range: EntityPropertyValue[] = rawRange as EntityPropertyValue[]
        from = range[0].value()
        to = range[1].value()
    } else if (rawRange instanceof NativeValue && rawRange.value() instanceof Array) {
        // range represented as NativeValue, this happens when the data type of attribute is an array of ranges

        const range: Range<any> = rawRange.value() as Range<any>
        from = range[0]
        to = range[1]
    } else {
        throw new UnexpectedError(undefined, `Invalid DateTimeRange value.`)
    }

    const formatEnd = (end: DateTime | BigDecimal | Long | number): string => {
        if (end == undefined || (typeof end === 'string' && end.trim().length === 0)) {
            return '∞'
        }
        return endPrettyPrinter(end)
    }

    return prefix + '`' + formatEnd(from) + '` - `' + formatEnd(to) + '`'
}

function handleActionClick(action: any) {
    switch (action) {
        case ActionType.Copy:
            copyRenderedValue()
            break
        case ActionType.PrettyPrint:
            prettyPrint.value = !prettyPrint.value
            break
    }
}

function copyRenderedValue() {
    navigator.clipboard.writeText(formattedValue.value).then(() => {
        toaster.info('Copied to clipboard.')
    }).catch(() => {
        toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
    })
}
</script>

<template>
    <LabEditorDataGridGridCellDetailValueRenderer
        :fill-space="fillSpace"
        :actions="actions"
        @click:action="handleActionClick"
    >
        <div class="markdown-renderer">
            <VMarkdown :source="formattedValue" />
        </div>
    </LabEditorDataGridGridCellDetailValueRenderer>
</template>

<style lang="scss" scoped>
.markdown-renderer {
    padding: 1rem;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow: auto;
}
</style>
