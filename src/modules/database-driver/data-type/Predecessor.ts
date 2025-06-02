/**
 * Predecessor is a special data type allowing to create consistent or semi-consistent linked lists in evitaDB and sort
 * by the order of the elements in the list. Predecessor represents a reference to another entity of the same type
 * as itself that is the predecessor of the entity it is attached to.
 */
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
