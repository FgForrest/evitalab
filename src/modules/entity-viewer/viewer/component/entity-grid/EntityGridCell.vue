<script setup lang="ts">
/**
 * Content of a single entity grid cell rendered inside a `VDataGrid` cell: the printable value with a type-specific
 * prepended icon or a placeholder, the value tooltip, middle-click copy and the cell context menu. Left click is
 * handled by the grid itself.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { useToaster } from '@/modules/notification/service/Toaster'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { useDataLocale, useTabProps } from '@/modules/entity-viewer/viewer/component/dependencies'
import { isLocalizedSchema } from '@/modules/database-driver/request-response/schema/LocalizedSchema'
import { isTypedSchema } from '@/modules/database-driver/request-response/schema/TypedSchema'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue.ts'
import type { Predecessor } from '@/modules/database-driver/data-type/Predecessor.ts'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema.ts'
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences.ts'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes.ts'
import { copyToClipboard } from '@/utils/clipboard'
import {
    EntityGridCellMenuFactory,
    useEntityGridCellMenuFactory
} from '@/modules/entity-viewer/viewer/service/EntityGridCellMenuFactory'
import {
    EntityGridCellMenuItemType
} from '@/modules/entity-viewer/viewer/model/entity-grid/EntityGridCellMenuItemType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { errorMessage } from '@/utils/error'

const tabProps = useTabProps()
const entityGridCellMenuFactory: EntityGridCellMenuFactory = useEntityGridCellMenuFactory()
const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    entityPrimaryKey: number,
    propertyDescriptor: EntityPropertyDescriptor | undefined,
    propertyValue: EntityPropertyValue | EntityPropertyValue[] | undefined,
    /**
     * The value printed by the grid column, see `EntityPropertyValuePrinter`.
     */
    printableValue: string
}>()
const dataLocale = useDataLocale()
const parent = ref()

const prependIcon = computed<string | undefined>(() => {
    if (props.propertyDescriptor?.type === EntityPropertyType.Entity && props.propertyDescriptor?.key.name === StaticEntityProperties.ParentPrimaryKey) {
        return 'mdi-open-in-new'
    } else if (props.propertyDescriptor?.schema != undefined &&
        isTypedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.type === Scalar.Predecessor) {
        if (props.propertyValue instanceof Array)
            return undefined
        if (((props.propertyValue as NativeValue).value() as Predecessor).predecessorId === -1) {
            return 'mdi-ray-start'
        } else {
            return 'mdi-ray-end-arrow'
        }
    } else if (props.propertyDescriptor?.type === EntityPropertyType.References && props.propertyDescriptor.schema instanceof ReferenceSchema) {
        return 'mdi-link-variant'
    } else
        return undefined
})

const noLocaleSelected = computed<boolean>(() => {
    return props.propertyDescriptor?.schema != undefined &&
        isLocalizedSchema(props.propertyDescriptor.schema) &&
        props.propertyDescriptor.schema.localized &&
        dataLocale.value == undefined
})
const emptyArray = computed<boolean>(() => {
    return props.propertyValue instanceof Array && props.propertyValue.length === 0
})
const emptyReferences = computed<boolean>(() => {
    return (props.propertyValue instanceof EntityReferences || props.propertyValue instanceof EntityReferenceAttributes) &&
        props.propertyValue.count() === 0
})
const nullValue = computed<boolean>(() => {
    return props.propertyValue == undefined
})

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

            copyToClipboard(value).then(() => {
                toaster.info(t('common.notification.copiedToClipboard')).then()
            }).catch(() => {
                toaster.error(t('common.notification.failedToCopyToClipboard')).then()
            })
        }
    } else {
        if (props.printableValue) {
            copyToClipboard(props.printableValue).then(() => {
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
            return props.printableValue
        }
    } else {
        return props.printableValue
    }
})

function handleMouseDown(e: MouseEvent): void {
    // preventDefault must stay inside the branch: a default-prevented button 2 mousedown suppresses the
    // subsequent contextmenu event in some browsers, which would kill the cell menu
    if (e.button === 1) {
        e.preventDefault()
        copyValue(e.shiftKey)
    }
}

const menuOpened = ref<boolean>(false)
const menuTarget = ref<[number, number]>([0, 0])
const menuItems = ref<Map<EntityGridCellMenuItemType, MenuItem<EntityGridCellMenuItemType>>>()
const menuItemList = computed<MenuAction<EntityGridCellMenuItemType>[]>(() => {
    if (menuItems.value == undefined) {
        return []
    }
    return Array.from(menuItems.value.values())
        .filter((item): item is MenuAction<EntityGridCellMenuItemType> => item instanceof MenuAction)
})

async function openMenu(e: MouseEvent): Promise<void> {
    try {
        menuItems.value = await entityGridCellMenuFactory.createItems(
            tabProps.params.dataPointer.catalogName,
            tabProps.params.dataPointer.entityType,
            props.entityPrimaryKey,
            props.propertyDescriptor,
            () => copyValue(false),
            () => copyValue(true)
        )
    } catch (e) {
        await toaster.error(errorMessage(e))
        return
    }

    menuTarget.value = [e.clientX, e.clientY]
    menuOpened.value = true
}

function handleMenuAction(actionType: EntityGridCellMenuItemType): void {
    const action: MenuItem<EntityGridCellMenuItemType> | undefined = menuItems.value?.get(actionType)
    if (action instanceof MenuAction) {
        action.execute()
    }
}
</script>

<template>
    <span ref="parent" class="data-grid-cell" :class="{ 'data-grid-cell--clickable': printableValue && !emptyReferences }"
        @mousedown="handleMouseDown"
        @contextmenu.prevent="openMenu">
        <span class="data-grid-cell__body">
            <template v-if="noLocaleSelected">
                <span class="text-disabled">{{ t('entityViewer.grid.cell.placeholder.noLocaleSelected') }}</span>
            </template>
            <template v-else-if="emptyReferences">
                <span class="text-disabled">{{ printableValue }}</span>
            </template>
            <template v-else-if="emptyArray">
                <span class="text-disabled">{{ t('common.placeholder.emptyArray') }}</span>
            </template>
            <template v-else-if="nullValue">
                <span class="text-disabled">{{ t('common.placeholder.null') }}</span>
            </template>
            <template v-else>
                <VIcon v-if="prependIcon !== undefined" class="mr-1">{{ prependIcon }}</VIcon>
                <span class="data-grid-cell__value">{{ printableValue }}</span>
                <VTooltip
                    :activator="parent"
                    location="bottom"
                    :interactive="true">
                    <div>
                        <VChip class="chip" size="small">
                            <span>{{ t('command.entityViewer.entityGrid.entityGridCell.copyValueToolTip') }}</span>
                            <span class="text-disabled ml-1">
                                ({{ t('command.entityViewer.entityGrid.entityGridCell.copyValueToolTipDescription')
                                }})
                            </span>
                        </VChip>
                        <VChip class="chip" size="small">
                            <span>{{ t('command.entityViewer.entityGrid.entityGridCell.rawCopyToolTip') }}</span>
                            <span class="text-disabled ml-1">
                                ({{ t('command.entityViewer.entityGrid.entityGridCell.rawCopyToolTipDescription')
                                }})
                            </span>
                        </VChip>
                    </div>
                    <hr />
                    <p>{{ tooltip }}</p>
                </VTooltip>
            </template>
        </span>

        <VMenu
            v-if="menuItemList.length > 0"
            v-model="menuOpened"
            :target="menuTarget"
        >
            <VList
                density="compact"
                :items="menuItemList"
                @click:select="handleMenuAction($event.id as EntityGridCellMenuItemType)"
            >
                <template #item="{ props }">
                    <VListItem
                        :prepend-icon="props.prependIcon"
                        :value="props.value"
                        :disabled="props.disabled"
                    >
                        {{ props.title }}
                    </VListItem>
                </template>
            </VList>
        </VMenu>
    </span>
</template>

<style scoped lang="scss">
// fills the whole grid cell, so that the context menu, middle click and hover cover all of it
.data-grid-cell {
    position: absolute;
    inset: 0;
    padding: 0 12px;
}

.data-grid-cell--clickable {
    cursor: pointer;

    &:hover {
        background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
    }
}

.data-grid-cell__body {
    display: flex;
    align-items: center;
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
}

.data-grid-cell__value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
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

p {
    margin: 10px;
}
</style>
