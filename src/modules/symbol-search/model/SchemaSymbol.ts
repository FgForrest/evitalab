import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import type { SymbolPath } from '@/modules/symbol-search/model/SymbolPath'
import type { AttributeOwner } from '@/modules/symbol-search/model/AttributeOwner'
import type { CatalogSymbolStatus } from '@/modules/symbol-search/model/CatalogSymbolStatus'

/**
 * A single schema item (catalog, entity collection, attribute, …) findable by the symbol search. One instance
 * exists per schema item and is shared by all index keys of its name variants, so a search hitting several
 * variants yields it once.
 *
 * Named `SchemaSymbol` rather than `Symbol` so it does not shadow the global `Symbol`.
 */
export class SchemaSymbol {
    readonly type: SymbolType
    /** display name, as defined in the schema */
    readonly name: string
    readonly path: SymbolPath
    /** owner of an attribute or a sortable attribute compound, undefined for other types */
    readonly attributeOwner: AttributeOwner | undefined
    /** state of the catalog, only for catalog symbols */
    readonly catalogStatus: CatalogSymbolStatus | undefined
    private _sortName: string | undefined = undefined

    constructor(type: SymbolType,
                name: string,
                path: SymbolPath,
                attributeOwner?: AttributeOwner,
                catalogStatus?: CatalogSymbolStatus) {
        this.type = type
        this.name = name
        this.path = path
        this.attributeOwner = attributeOwner
        this.catalogStatus = catalogStatus
    }

    /**
     * Names of the enclosing schemas rendered before the symbol name. Empty for a catalog, whose path holds only
     * the catalog itself.
     */
    get displayPath(): string[] {
        return this.type === SymbolType.Catalog ? [] : this.path.segments
    }

    /**
     * Lower-cased name used to order search results alphabetically. Derived lazily, most symbols are never
     * compared by name.
     */
    get sortName(): string {
        if (this._sortName == undefined) {
            this._sortName = this.name.toLowerCase()
        }
        return this._sortName
    }

    /**
     * Identifier unique within a connection.
     */
    get id(): string {
        return `${this.type}:${this.attributeOwner ?? ''}:${this.path.toString()}:${this.name}`
    }
}
