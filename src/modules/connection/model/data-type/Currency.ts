//TODO: Add documentation
export class Currency {
    code: string

    constructor(code: string){
        this.code = code;
    }

    toString():string{
        return this.code;
    }
}
