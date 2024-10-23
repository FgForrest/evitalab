export class EventType {
    readonly id: string
    readonly name: string
    readonly description: string

    constructor(id: string, name: string, description: string) {
        this.id = id
        this.name = name
        this.description = description
    }

    toString(): string {
        return this.name
    }
}
