import { Map, List, Set } from "immutable";
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { AttributeValue } from '@/modules/connection/model/data/AttributeValue'

//TODO: Add documentation
export class Attributes {
    private readonly globalAttributes: Map<string, any>
    private readonly localizedAttributes: Map<string, Map<string, any>>

    private _allAttributes?: List<AttributeValue> = undefined
    private _names?: Set<string> = undefined
    private _locales?: Set<Locale> = undefined

    constructor(globalAttributes: Map<string, any>, localizedAttributes: Map<string, Map<string, any>>){
        this.globalAttributes = globalAttributes
        this.localizedAttributes = localizedAttributes
    }

    attribute(attributeName: string): any | undefined
    attribute(attributeName: string, locale?: Locale): any | undefined
    attribute(attributeName: string, locale?: Locale): any | undefined {
        if (locale == undefined) {
            return this.globalAttributes.get(attributeName)
        }
        return this.localizedAttributes.get(locale.toString())?.get(attributeName)
    }

    get allAttributes(): List<AttributeValue> {
        if (this._allAttributes == undefined) {
            const allAttributes: AttributeValue[] = []
            for (const [name, value] of this.globalAttributes) {
                allAttributes.push(new AttributeValue(
                    undefined,
                    name,
                    value
                ))
            }
            for (const [locale, localizedAttributes] of this.localizedAttributes) {
                for (const [name, value] of localizedAttributes) {
                    allAttributes.push(new AttributeValue(
                        new Locale(locale),
                        name,
                        value
                    ))
                }
            }
            this._allAttributes = List.of(...allAttributes)
        }
        return this._allAttributes
    }

    get names(): Set<string> {
        if (this._names == undefined) {
            const allNames: string[] = [...this.globalAttributes.keys()]
            for (const [_, attributes] of this.localizedAttributes) {
                allNames.push(...attributes.keys())
            }
            this._names = Set.of(...allNames)
        }
        return this._names
    }

    get locales(): Set<Locale> {
        if (this._locales == undefined) {
            this._locales = Set.of(
                ...Array.from(this.localizedAttributes.keys())
                    .map(it => new Locale(it))
            )
        }
        return this._locales
    }

    toString(): string {
        const resultStrings: string[] = []
        for(const [_, value] of this.globalAttributes){
            resultStrings.push(String(value));
        }
        return resultStrings.join(';')
    }
}
