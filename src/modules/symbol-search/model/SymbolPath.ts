/**
 * Location of a symbol inside the schema tree of a connection — the schemas enclosing it, from the broadest one.
 */
export class SymbolPath {
    readonly catalogName: string
    readonly entityType: string | undefined
    readonly referenceName: string | undefined
    /** the segments joined by `/`, computed once as it breaks ties when ordering search results */
    private readonly joined: string

    constructor(catalogName: string, entityType?: string, referenceName?: string) {
        this.catalogName = catalogName
        this.entityType = entityType
        this.referenceName = referenceName
        this.joined = this.segments.join('/')
    }

    /**
     * Enclosing schema names from the broadest one.
     */
    get segments(): string[] {
        const segments: string[] = [this.catalogName]
        if (this.entityType != undefined) {
            segments.push(this.entityType)
        }
        if (this.referenceName != undefined) {
            segments.push(this.referenceName)
        }
        return segments
    }

    toString(): string {
        return this.joined
    }
}
