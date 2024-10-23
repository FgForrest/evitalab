//TODO: Add docs
export class Predecessor {
    readonly head: boolean
    readonly predecessorId: number | undefined

    constructor(head: boolean, predecessorId: number | undefined){
        this.head = head
        this.predecessorId = predecessorId
    }

    toString():string{
        return String(this.predecessorId)
    }
}