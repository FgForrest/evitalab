import type { InjectionKey } from 'vue'
import { List as ImmutableList } from 'immutable'
import type { Scalar } from '@/modules/database-driver/data-type/Scalar'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { PriceInnerRecordHandling } from '@/modules/database-driver/data-type/PriceInnerRecordHandling'
import type { ValuePrinter } from '@/modules/value-presentation/service/ValuePrinter'
import { ArrayValuePrinter } from '@/modules/value-presentation/service/ArrayValuePrinter'
import {
    type DataTypeClass,
    defaultDataTypeValuePrinters,
    defaultScalarValuePrinters,
    type ScalarValuePrinterTable
} from '@/modules/value-presentation/service/scalarValuePrinters'
import { isPlainObjectOrArray } from '@/utils/object'
import { serializeJsonWithBigInt } from '@/utils/JsonUtil'
import { mandatoryInject } from '@/utils/reactivity'
import { i18n } from '@/vue-plugins/i18n'

export const evitaValuePrinterInjectionKey: InjectionKey<EvitaValuePrinter> = Symbol('EvitaValuePrinter')

const entityScopeKeys: Readonly<Record<EntityScope, string>> = {
    [EntityScope.Live]: 'common.scope.live',
    [EntityScope.Archive]: 'common.scope.archive',
}

const priceInnerRecordHandlingKeys: Readonly<Record<PriceInnerRecordHandling, string>> = {
    [PriceInnerRecordHandling.None]: 'common.priceInnerRecordHandling.None',
    [PriceInnerRecordHandling.LowestPrice]: 'common.priceInnerRecordHandling.LowestPrice',
    [PriceInnerRecordHandling.Sum]: 'common.priceInnerRecordHandling.Sum',
    [PriceInnerRecordHandling.Unknown]: 'common.priceInnerRecordHandling.Unknown',
}

/**
 * Returns the translated name of a known member of an enum, `undefined` for any other value.
 */
function translateEnumValue<E extends string>(keys: Readonly<Record<E, string>>, value: E): string | undefined {
    return Object.hasOwn(keys, value) ? i18n.global.t(keys[value]) : undefined
}

/**
 * Prints any evitaDB value as human-readable text: by its {@link Scalar} when the caller knows it, otherwise by the
 * value's runtime type.
 *
 * The runtime type alone cannot tell everything apart (`Byte`/`Short`/`Integer` are all `number`, a plain array may be
 * an array value or complex data), so callers that know the scalar should pass it — the scalar decides.
 */
export class EvitaValuePrinter {
    private readonly scalarPrinters: ScalarValuePrinterTable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each class has a different model type, the class decides which
    private readonly dataTypePrinters: ReadonlyArray<readonly [DataTypeClass, ValuePrinter<any>]>
    private readonly listPrinter: ArrayValuePrinter<unknown>

    constructor(scalarPrinters: ScalarValuePrinterTable = defaultScalarValuePrinters,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see the field
                dataTypePrinters: ReadonlyArray<readonly [DataTypeClass, ValuePrinter<any>]> = defaultDataTypeValuePrinters) {
        this.scalarPrinters = scalarPrinters
        this.dataTypePrinters = dataTypePrinters
        this.listPrinter = new ArrayValuePrinter<unknown>({ print: item => this.print(item) })
    }

    /**
     * Returns the human-readable text of the value; a missing value prints as an empty string.
     *
     * Without a scalar the value is dispatched by its runtime type: a driver data type by its class (first match of
     * the data type printers), an immutable list item by item as `[a, b]`, a plain object or array (complex data) as
     * JSON and anything else by its string form.
     */
    print(value: unknown, scalar?: Scalar): string {
        if (value == undefined) {
            return ''
        }
        if (scalar != undefined) {
            return this.scalarPrinters[scalar].print(value)
        }
        for (const [dataTypeClass, printer] of this.dataTypePrinters) {
            if (Object.prototype.isPrototypeOf.call(dataTypeClass.prototype, value)) {
                return printer.print(value)
            }
        }
        if (ImmutableList.isList(value)) {
            return this.listPrinter.print(value as ImmutableList<unknown>)
        }
        if (isPlainObjectOrArray(value)) {
            return serializeJsonWithBigInt(value)
        }
        return String(value)
    }

    /**
     * Returns the translated name of the entity scope; any other value, so that an unexpected server value is still
     * shown, is printed by {@link print}.
     */
    printEntityScope(scope: EntityScope): string {
        return translateEnumValue(entityScopeKeys, scope) ?? this.print(scope)
    }

    /**
     * Returns the translated name of the price inner record handling; any other value is printed by {@link print}.
     */
    printPriceInnerRecordHandling(handling: PriceInnerRecordHandling): string {
        return translateEnumValue(priceInnerRecordHandlingKeys, handling) ?? this.print(handling)
    }
}

export function useEvitaValuePrinter(): EvitaValuePrinter {
    return mandatoryInject(evitaValuePrinterInjectionKey) as EvitaValuePrinter
}
