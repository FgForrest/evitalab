import { List as ImmutableList } from 'immutable'

/**
 * Represents a single endpoint of server API
 */
export class Endpoint {
    readonly name: string
    readonly urls: ImmutableList<string>

    constructor(name: string, urls: ImmutableList<string>) {
        this.name = name
        this.urls = urls
    }
}
