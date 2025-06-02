/**
 * A Locale object represents a specific geographical, political, or cultural region.
 */
export class Locale {
    readonly languageTag: string

    constructor(languageTag: string){
        this.languageTag = languageTag;
    }

    toString():string{
        return this.languageTag;
    }
}
