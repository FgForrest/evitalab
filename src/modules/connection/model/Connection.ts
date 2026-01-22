import XXH from 'xxhashjs'
import type { HashObject } from 'xxhashjs'
import type { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

const hasher: HashObject = XXH.h64()

export interface ConnectionJson {
    id?: string
    name: string
    serverUrl: string
}

/**
 * Represents a connection to an evitaDB server. This allows the user to
 * fetch data from a specific evitaDB server.
 */
export class Connection {

    readonly id: ConnectionId
    readonly name: string
    readonly serverUrl: string

    private _grpcUrl?: string
    private _graphQlUrl?: string
    private _restUrl?: string
    private _observabilityUrl?: string

    constructor(id: ConnectionId | undefined,
                name: string,
                serverUrl: string) {
        // note: by default name hash is used, because otherwise we would generate
        // new ID for each evitaLab session and a user would never be able to restore
        // previous session
        // (there is currently no easy way to store the generated ID in evitaLab or evitaDB if embedded)
        this.id = id ? id : hasher.update(name).digest().toString(16)
        this.name = name
        this.serverUrl = this.validateAndNormalizeUrl(serverUrl)
    }

    static fromJson(json: ConnectionJson): Connection {
        return new Connection(
            json.id,
            json.name,
            json.serverUrl
        )
    }

    get shortName(): string {
        const parts: string[] = this.name.split(/[^a-zA-Z0-9]+/)
        if (parts.length > 3) {
            return parts.slice(0, 2)
                    .map(part => part.substring(0, 1).toUpperCase())
                    .join('') +
                parts.at(-1)!
                    .substring(0, 1)
                    .toUpperCase()
        } else {
            return parts.map(part => part.substring(0, 1).toUpperCase()).join('')
        }
    }

    get grpcUrl(): string {
        if (this._grpcUrl == undefined) {
            this._grpcUrl = this.serverUrl
        }
        return this._grpcUrl
    }

    get graphQlUrl(): string {
        if (this._graphQlUrl == undefined) {
            this._graphQlUrl = `${this.serverUrl}/gql`
        }
        return this._graphQlUrl
    }

    get restUrl(): string {
        if (this._restUrl == undefined) {
            this._restUrl = `${this.serverUrl}/rest`
        }
        return this._restUrl
    }

    get observabilityUrl(): string {
        if (this._observabilityUrl == undefined) {
            this._observabilityUrl = `${this.serverUrl}/observability`
        }
        return this._observabilityUrl
    }

    private validateAndNormalizeUrl(url: string): string {
        try {
            new URL(url)
        } catch {
            throw new UnexpectedError('Server URL is not valid URL.')
        }
        return url.endsWith('/') ? url.substring(0, url.length - 1) : url
    }
}
