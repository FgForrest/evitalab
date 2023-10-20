<script setup lang="ts">

import { Toaster, useToaster } from '@/services/editor/toaster'
import { UnexpectedError } from '@/model/lab'
import LabEditorDataGridGridCellDetailValueRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailValueRenderer.vue'
import VMarkdown from '@/components/base/VMarkdown.vue'
import { computed, ref } from 'vue'
import { Scalar } from '@/model/evitadb'

const toaster: Toaster = useToaster()

const whiteSpacePattern = /\s+/

const offsetDateTimeFormatter = new Intl.DateTimeFormat([], { dateStyle: "full", timeStyle: "long" })
const localDateTimeFormatter = new Intl.DateTimeFormat([], { dateStyle: 'full', timeStyle: "medium" })
const localDateFormatter = new Intl.DateTimeFormat([], { dateStyle: "full" })
const localTimeFormatter = new Intl.DateTimeFormat([], { timeStyle: "medium" })

enum ActionType {
    Copy = 'copy',
    PrettyPrint = 'pretty-print'
}

const props = withDefaults(defineProps<{
    value: any,
    dataType: Scalar | undefined,
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
    if (!prettyPrint.value || !props.dataType) {
        return props.value.toString()
    }
    switch (props.dataType) {
        case Scalar.String: {
            const stringValue: string = (props.value as string).trim()
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
            return '`' + props.value.toString() + '`'
        case Scalar.OffsetDateTime:
            return '📅 `' + offsetDateTimeFormatter.format(new Date(props.value.toString())) + '`'
        case Scalar.LocalDateTime:
            return '📅 `' + localDateTimeFormatter.format(new Date(props.value.toString())) + '`'
        case Scalar.LocalDate:
            return '📅 `' + localDateFormatter.format(new Date(props.value.toString())) + '`'
        case Scalar.LocalTime:
            return '📅 `' + localTimeFormatter.format( new Date('1970-01-01' + props.value.toString())) + '`'
        case Scalar.DateTimeRange:
            return prettyPrintRangeValue(
                props.value,
                '📅 ',
                (end: string): string => offsetDateTimeFormatter.format(new Date(end))
            )
        case Scalar.ByteNumberRange:
        case Scalar.ShortNumberRange:
        case Scalar.IntegerNumberRange:
            return prettyPrintRangeValue(
                props.value,
                '',
                (end: string): string => end.toString()
            )
        case Scalar.BigDecimalNumberRange:
        case Scalar.LongNumberRange:
            return prettyPrintRangeValue(
                props.value,
                '',
                (end: string): string => end
            )
        case Scalar.Locale:
            return '🌐 `' + props.value.toString() + '`'
        case Scalar.Currency:
            return '💰 `' + props.value.toString() + '`'
        case Scalar.Predecessor:
            return '↻ `' + props.value.toString() + '`'
        case Scalar.ComplexDataObject:
            return '```json\r\n' + JSON.stringify(props.value, null, 2) + '\r\n```'
        default:
            return props.value.toString()
    }
})

function prettyPrintRangeValue(rawRange: any, prefix: string, endPrettyPrinter: (end: any) => string): string {
    if (!(props.value instanceof Array) || props.value.length !== 2) {
        throw new UnexpectedError(undefined, 'Invalid DateTimeRange value.')
    }
    const range: any[] = props.value as any[]
    const from: any = range[0]
    const to: any = range[1]

    const formatEnd = (end: any): string => {
        if (end == null) {
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
