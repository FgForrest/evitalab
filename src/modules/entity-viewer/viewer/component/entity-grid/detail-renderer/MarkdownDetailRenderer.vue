<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value as Markdown.
 */

import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { ExtraEntityObjectType } from '@/modules/entity-viewer/viewer/model/ExtraEntityObjectType'
import ValueDetailRenderer from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ValueDetailRenderer.vue'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import { MarkdownDetailRendererMenuItemType } from '@/modules/entity-viewer/viewer/model/entity-grid/detail-renderer/MarkdownDetailRendererMenuItemType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import {
    MarkdownDetailRendererMenuFactory,
    useMarkdownDetailRendererMenuFactory
} from '@/modules/entity-viewer/viewer/service/MarkdownDetailRendererMenuFactory'

const markdownDetailRendererMenuFactory: MarkdownDetailRendererMenuFactory = useMarkdownDetailRendererMenuFactory()
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

const menuItems = ref<Map<MarkdownDetailRendererMenuItemType, MenuItem<MarkdownDetailRendererMenuItemType>>>()
const menuItemList: ComputedRef<MenuItem<MarkdownDetailRendererMenuItemType>[]> =
    computed(() => {
        if (menuItems.value == undefined) {
            return []
        }
        return Array.from(menuItems.value.values())
    })
watch(
    prettyPrint,
    async () => menuItems.value = await createMenuItems(),
    { immediate: true }
)

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
    const foundedAction = menuItems.value?.get(action as MarkdownDetailRendererMenuItemType)
    if (foundedAction && foundedAction instanceof MenuAction) {
        (foundedAction as MenuAction<MarkdownDetailRendererMenuItemType>).execute()
    }
}

function copyRenderedValue() {
    navigator.clipboard
        .writeText(formattedValue.value)
        .then(() => {
            toaster.info(t('common.notification.copiedToClipboard')).then()
        })
        .catch(() => {
            toaster.error(t('common.notification.failedToCopyToClipboard')).then()
        })
}

async function createMenuItems(): Promise<Map<MarkdownDetailRendererMenuItemType, MenuItem<MarkdownDetailRendererMenuItemType>>> {
    return await markdownDetailRendererMenuFactory.createItems(
        prettyPrint.value,
        () => copyRenderedValue(),
        () => prettyPrint.value = !prettyPrint.value,
    )

}
</script>

<template>
    <ValueDetailRenderer
        :fill-space="fillSpace"
        :actions="menuItemList"
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
