//TODO: Add documentation
export class Locale {
    readonly languageTag: string

    constructor(languageTag: string){
        this.languageTag = languageTag;
    }

    toString():string{
        return this.languageTag;
    }
}