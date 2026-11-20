/**
 * Web APIs of the server that the console actions of the symbol search open. Resolved from the server status on every
 * open of the popup; unknown (e.g. while offline) means disabled.
 */
export class EnabledApis {

    readonly graphQL: boolean
    readonly rest: boolean

    constructor(graphQL: boolean, rest: boolean) {
        this.graphQL = graphQL
        this.rest = rest
    }

    /**
     * No API enabled — the state before the server status is known or when it cannot be read.
     */
    static none(): EnabledApis {
        return new EnabledApis(false, false)
    }

    equals(other: EnabledApis): boolean {
        return this.graphQL === other.graphQL && this.rest === other.rest
    }
}
