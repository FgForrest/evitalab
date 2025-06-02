import Immutable from 'immutable'

/**
 * Represents a single endpoint of server API
 */
export class Endpoint {
    readonly name: string
    readonly urls: Immutable.List<string>

    constructor(name: string, urls: Immutable.List<string>) {
        this.name = name
        this.urls = urls
    }
}
