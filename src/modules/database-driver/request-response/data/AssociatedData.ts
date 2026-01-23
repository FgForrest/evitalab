import { List, Map, Set } from 'immutable'
import { AssociatedDataValue } from '@/modules/database-driver/request-response/data/AssociatedDataValue'
import { Locale } from '@/modules/database-driver/data-type/Locale'

/**
 * Associated data carry additional data entries that are never used for filtering / sorting but may be needed to be fetched
 * along with entity in order to present data to the target consumer (i.e. user / API / bot). Associated data may be stored
 * in slower storage and may contain wide range of data types - from small ones (i.e. numbers, strings, dates) up to large
 * binary arrays representing entire files (i.e. pictures, documents).
 */
export class AssociatedData {
    private readonly globalAssociatedData: Map<string, any>
    private readonly localizedAssociatedData: Map<string, Map<string, any>>

    private _allAssociatedData?: List<AssociatedDataValue> = undefined
    private _names?: Set<string> = undefined
    private _locales?: Set<Locale> = undefined

    constructor(globalAssociatedData: Map<string, any>, localizedAssociatedData: Map<string, Map<string, any>>){
        this.globalAssociatedData = globalAssociatedData
        this.localizedAssociatedData = localizedAssociatedData
    }

    associatedData(associatedDataName: string): any | undefined
    associatedData(associatedDataName: string, locale?: Locale): any | undefined
    associatedData(associatedDataName: string, locale?: Locale): any | undefined {
        if (locale == undefined) {
            return this.globalAssociatedData.get(associatedDataName)
        }
        return this.localizedAssociatedData.get(locale.toString())?.get(associatedDataName)
    }

    get allAssociatedData(): List<AssociatedDataValue> {
        if (this._allAssociatedData == undefined) {
            const allAssociatedData: AssociatedDataValue[] = []
            for (const [name, value] of this.globalAssociatedData) {
                allAssociatedData.push(new AssociatedDataValue(
                    undefined,
                    name,
                    value
                ))
            }
            for (const [locale, localizedAssociatedData] of this.localizedAssociatedData) {
                for (const [name, value] of localizedAssociatedData) {
                    allAssociatedData.push(new AssociatedDataValue(
                        new Locale(locale),
                        name,
                        value
                    ))
                }
            }
            this._allAssociatedData = List.of(...allAssociatedData)
        }
        return this._allAssociatedData
    }

    get names(): Set<string> {
        if (this._names == undefined) {
            const allNames: string[] = [...this.globalAssociatedData.keys()]
            for (const [, associatedData] of this.localizedAssociatedData) {
                allNames.push(...associatedData.keys())
            }
            this._names = Set.of(...allNames)
        }
        return this._names
    }

    get locales(): Set<Locale> {
        if (this._locales == undefined) {
            this._locales = Set.of(
                ...Array.from(this.localizedAssociatedData.keys())
                    .map(it => new Locale(it))
            )
        }
        return this._locales
    }

    toString(): string {
        const resultStrings: string[] = []
        for(const [, value] of this.globalAssociatedData){
            resultStrings.push(String(value));
        }
        return resultStrings.join(';')
    }
}
