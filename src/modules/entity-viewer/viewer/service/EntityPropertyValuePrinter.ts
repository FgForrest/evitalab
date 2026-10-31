import type { InjectionKey } from 'vue'
import type { Scalar } from '@/modules/database-driver/data-type/Scalar'
import type { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import type { DataGridValuePrinter } from '@/modules/base/service/data-grid/DataGridValuePrinter'
import type { EvitaValuePrinter } from '@/modules/value-presentation/service/EvitaValuePrinter'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import type {
    EntityViewerPrintContext
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityViewerPrintContext'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { mandatoryInject } from '@/utils/reactivity'

export const entityPropertyValuePrinterInjectionKey: InjectionKey<EntityPropertyValuePrinter> =
    Symbol('EntityPropertyValuePrinter')

/**
 * Value of a single entity grid cell: one value, or one value per item of an array property.
 */
export type EntityGridValue = EntityPropertyValue | EntityPropertyValue[]

/**
 * Printer of a single entity grid column.
 */
export type EntityGridValuePrinter = DataGridValuePrinter<EntityGridValue, FlatEntity, EntityViewerPrintContext>

function isEmptyCell(value: EntityGridValue | undefined): boolean {
    return value == undefined || (value instanceof Array && value.length === 0)
}

function rawValueOf(value: EntityGridValue): unknown {
    return value instanceof Array ? value.map(item => item.value()) : value.value()
}

/**
 * Prints entity property values as human-readable text, as displayed in the entity grid and copied as the
 * "printable" value. Creates printers of the entity grid columns: scalar columns print through
 * {@link EvitaValuePrinter} by their scalar type, enum columns through its enum methods and composite columns (prices,
 * references, parent) by their preview with the entity viewer's context. A missing value and an empty array print as
 * an empty string, the cell renders a placeholder for them instead.
 */
export class EntityPropertyValuePrinter {
    private readonly valuePrinter: EvitaValuePrinter

    constructor(valuePrinter: EvitaValuePrinter) {
        this.valuePrinter = valuePrinter
    }

    /**
     * Returns the printer of the column of the given entity property.
     */
    forColumn(descriptor: EntityPropertyDescriptor): EntityGridValuePrinter {
        const printEnum: ((raw: unknown) => string) | undefined = this.enumPrinterOf(descriptor)
        if (printEnum != undefined) {
            return this.rawValueColumnPrinter(printEnum)
        }
        const scalar: Scalar | undefined = descriptor.scalar
        if (scalar != undefined) {
            return this.rawValueColumnPrinter(raw => this.valuePrinter.print(raw, scalar))
        }
        return {
            print: (value, _row, context) => this.print(value, context)
        }
    }

    /**
     * Prints the translated name of the value of an enum property (`scope`, `priceInnerRecordHandling`), the same
     * text as its grid column; `undefined` when the property is not an enum.
     */
    printEnum(descriptor: EntityPropertyDescriptor, value: EntityGridValue | undefined): string | undefined {
        const printEnum: ((raw: unknown) => string) | undefined = this.enumPrinterOf(descriptor)
        if (printEnum == undefined) {
            return undefined
        }
        return isEmptyCell(value) ? '' : printEnum(rawValueOf(value!))
    }

    /**
     * Prints a single value or an array of values without knowing its scalar: a native value by its runtime type,
     * an array item by item as `[a, b]` and a composite value by its preview.
     */
    print(value: EntityPropertyValue | EntityPropertyValue[] | undefined, context?: EntityViewerPrintContext): string {
        if (value == undefined) {
            return ''
        }
        if (value instanceof Array) {
            if (value.length === 0) {
                return ''
            }
            return `[${value.map(item => this.printItem(item, context)).join(', ')}]`
        }
        return this.printItem(value, context)
    }

    /**
     * Prints a single value, see {@link print}; for callers that join array items on their own.
     */
    printItem(value: EntityPropertyValue, context?: EntityViewerPrintContext): string {
        if (value instanceof NativeValue) {
            return this.valuePrinter.print(value.value())
        }
        if (value instanceof EntityPropertyValue) {
            return value.toPreviewString(context)
        }
        throw new UnexpectedError('Unexpected property value type: ' + typeof value)
    }

    private enumPrinterOf(descriptor: EntityPropertyDescriptor): ((raw: unknown) => string) | undefined {
        if (descriptor.type !== EntityPropertyType.Entity) {
            return undefined
        }
        switch (descriptor.key.name) {
            case StaticEntityProperties.Scope:
                return raw => this.valuePrinter.printEntityScope(raw as EntityScope)
            case StaticEntityProperties.PriceInnerRecordHandling:
                return raw => this.valuePrinter.printPriceInnerRecordHandling(raw as PriceInnerRecordHandling)
            default:
                return undefined
        }
    }

    /**
     * Prints the raw value of a cell through the given function, an empty cell as an empty string.
     */
    private rawValueColumnPrinter(printRaw: (raw: unknown) => string): EntityGridValuePrinter {
        return {
            print: value => isEmptyCell(value) ? '' : printRaw(rawValueOf(value!))
        }
    }
}

export function useEntityPropertyValuePrinter(): EntityPropertyValuePrinter {
    return mandatoryInject(entityPropertyValuePrinterInjectionKey) as EntityPropertyValuePrinter
}
