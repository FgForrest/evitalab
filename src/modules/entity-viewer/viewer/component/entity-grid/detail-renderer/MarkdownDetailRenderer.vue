<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value as Markdown.
 */

import { computed, ComputedRef, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { ExtraEntityObjectType } from '@/modules/entity-viewer/viewer/model/ExtraEntityObjectType'
import { LocalDateTime } from '@/modules/connection/model/data-type/LocalDateTime'
import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import { Range } from '@/modules/connection/model/data-type/Range'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import ValueDetailRenderer from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ValueDetailRenderer.vue'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { MarkdownDetailRendererActionType } from '@/modules/entity-viewer/viewer/model/entity-grid/detail-renderer/MarkdownDetailRendererActionType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { DateTimeRange } from '@/modules/connection/model/data-type/DateTimeRange'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const whiteSpacePattern = /\s+/

const offsetDateTimeFormatter = new Intl.DateTimeFormat([], {
    dateStyle: 'medium',
    timeStyle: 'long',
})
const localDateTimeFormatter = new Intl.DateTimeFormat([], {
    dateStyle: 'medium',
    timeStyle: 'medium',
})
const localDateFormatter = new Intl.DateTimeFormat([], { dateStyle: 'medium' })
const localTimeFormatter = new Intl.DateTimeFormat([], { timeStyle: 'medium' })

const props = withDefaults(
    defineProps<{
        value: EntityPropertyValue | EntityPropertyValue[]
        dataType: Scalar | ExtraEntityObjectType | undefined
        fillSpace?: boolean
    }>(),
    {
        fillSpace: true,
    }
)

const prettyPrint = ref<boolean>(true)

const actions: ComputedRef<
    Map<
        MarkdownDetailRendererActionType,
        MenuAction<MarkdownDetailRendererActionType>
    >
> = computed(() => createActions())
const actionList: ComputedRef<MenuAction<MarkdownDetailRendererActionType>[]> =
    computed(() => Array.from(actions.value.values()))

const formattedValue = computed<string>(() => {
    if (
        !prettyPrint.value ||
        !props.dataType ||
        (props.value instanceof EntityPropertyValue && props.value.isEmpty())
    ) {
        return props.value instanceof Array
            ? `[${props.value.map((it) => it.toPreviewString()).join(', ')}]`
            : (props.value as EntityPropertyValue).toPreviewString()
    }
    try {
        switch (props.dataType) {
            case Scalar.String: {
                const stringValue: string = (
                    (props.value as EntityPropertyValue).value() as string
                ).trim()
                if (
                    stringValue.startsWith('{') ||
                    stringValue.startsWith('[')
                ) {
                    // probably JSON
                    return '```json\r\n' + stringValue + '\r\n```'
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
                return (
                    '`' +
                    (props.value as EntityPropertyValue).value().toString() +
                    '`'
                )
            case Scalar.OffsetDateTime:
                return (
                    '📅 `' +
                    offsetDateTimeFormatter.format(
                        new Date(
                            (props.value as EntityPropertyValue)
                                .value()
                                .toString()
                        )
                    ) +
                    '`'
                )
            case Scalar.LocalDateTime:
                return (
                    '📅 `' +
                    localDateTimeFormatter.format(
                        new Date(
                            (props.value as EntityPropertyValue)
                                .value()
                                .toString()
                        )
                    ) +
                    '`'
                )
            case Scalar.LocalDate:
                return (
                    '📅 `' +
                    localDateFormatter.format(
                        new Date(
                            (props.value as EntityPropertyValue)
                                .value()
                                .toString()
                        )
                    ) +
                    '`'
                )
            case Scalar.LocalTime:
                return (
                    '📅 `' +
                    localTimeFormatter.format(
                        new Date(
                            '1970-01-01' +
                                (props.value as EntityPropertyValue)
                                    .value()
                                    .toString()
                        )
                    ) +
                    '`'
                )
            case Scalar.DateTimeRange:
                return prettyPrintRangeValue(props.value, '📅 ')
            case Scalar.ByteNumberRange:
            case Scalar.ShortNumberRange:
            case Scalar.IntegerNumberRange:
                return prettyPrintRangeValue(props.value, '')
            case Scalar.BigDecimalNumberRange:
            case Scalar.LongNumberRange:
                return prettyPrintRangeValue(props.value, '')
            case Scalar.Locale:
                return (
                    '🌐 `' +
                    (props.value as EntityPropertyValue).value().toString() +
                    '`'
                )
            case Scalar.Currency:
                return (
                    '💰 `' +
                    (props.value as EntityPropertyValue).value().toString() +
                    '`'
                )
            case Scalar.Predecessor:
                return (
                    '↻ `' +
                    (props.value as EntityPropertyValue).value().toString() +
                    '`'
                )
            case Scalar.ComplexDataObject:
            case ExtraEntityObjectType.Prices:
            case ExtraEntityObjectType.ReferenceAttributes:
                return (
                    '```json\r\n' +
                    JSON.stringify(
                        (props.value as EntityPropertyValue).value(),
                        null,
                        2
                    ) +
                    '\r\n```'
                )
            default:
                return props.value instanceof Array
                    ? `[${props.value
                          .map((it) => it.toPreviewString())
                          .join(', ')}]`
                    : (props.value as EntityPropertyValue).toPreviewString()
        }
    } catch (e) {
        console.error(e)
        return t('entityViewer.grid.cell.detail.placeholder.invalidValue')
    }
})

function prettyPrintRangeValue(
    rawRange: EntityPropertyValue | EntityPropertyValue[],
    prefix: string
): string {
    if (rawRange instanceof EntityPropertyValue) {
        return prefix + '`' + rawRange.toPrettyPrintString() + '`'
    } else {
        return (
            prefix +
            '`' +
            rawRange.map((x) => x.toPrettyPrintString()).join(',') +
            '`'
        )
    }
}

function handleActionClick(action: any) {
    actions.value.get(action as MarkdownDetailRendererActionType)?.execute()
}

function copyRenderedValue() {
    navigator.clipboard
        .writeText(formattedValue.value)
        .then(() => {
            toaster.info(t('common.notification.copiedToClipboard'))
        })
        .catch(() => {
            toaster.error(
                new UnexpectedError(
                    t('common.notification.failedToCopyToClipboard')
                )
            )
        })
}

function createActions(): Map<
    MarkdownDetailRendererActionType,
    MenuAction<MarkdownDetailRendererActionType>
> {
    const actions: Map<
        MarkdownDetailRendererActionType,
        MenuAction<MarkdownDetailRendererActionType>
    > = new Map()
    actions.set(
        MarkdownDetailRendererActionType.Copy,
        new MenuAction<MarkdownDetailRendererActionType>(
            MarkdownDetailRendererActionType.Copy,
            t('common.button.copy'),
            'mdi-content-copy',
            () => copyRenderedValue()
        )
    )
    actions.set(
        MarkdownDetailRendererActionType.PrettyPrint,
        new MenuAction<MarkdownDetailRendererActionType>(
            MarkdownDetailRendererActionType.PrettyPrint,
            prettyPrint.value
                ? t('entityViewer.grid.renderer.button.displayRawValue')
                : t('entityViewer.grid.renderer.button.prettyPrintValue'),
            prettyPrint.value ? 'mdi-raw' : 'mdi-auto-fix',
            () => (prettyPrint.value = !prettyPrint.value)
        )
    )
    return actions
}
</script>

<template>
    <ValueDetailRenderer
        :fill-space="fillSpace"
        :actions="actionList"
        @click:action="handleActionClick"
    >
        <div class="markdown-renderer">
            <VMarkdown :source="formattedValue" />
        </div>
    </ValueDetailRenderer>
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
