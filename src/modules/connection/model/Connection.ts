import XXH, { HashObject } from 'xxhashjs'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

const hasher: HashObject = XXH.h64()

/**
 * Represents a connection to a single evitaDB server. This allows the user to
 * fetch data from concrete evitaDB server.
 */
export class Connection {

    // todo lho introduce type: USER, PRECONFIGURED, TEMP to not cache temp connection
    //  so that i can use entire driver stack without caching temp connection

    readonly id: ConnectionId
    readonly name: string
    readonly preconfigured: boolean
    readonly serverUrl: string

    private _grpcUrl?: string
    private _graphQlUrl?: string
    private _restUrl?: string
    private _observabilityUrl?: string

    private constructor(id: ConnectionId | undefined,
                name: string,
                preconfigured: boolean,
                serverUrl: string) {
        this.id = id ? id : hasher.update(name).digest().toString(16)
        this.name = name
        this.preconfigured = preconfigured
        this.serverUrl = this.validateAndNormalizeUrl(serverUrl)
    }

    static user(id: ConnectionId | undefined,
                name: string,
                serverUrl: string): Connection {
        return new Connection(id, name, false, serverUrl)
    }

    static preconfigured(id: ConnectionId | undefined,
                         name: string,
                         serverUrl: string): Connection {
        return new Connection(id, name, true, serverUrl)
    }

    static userFromJson(json: any): Connection {
        return new Connection(
            json.id,
            json.name,
            false,
            json.serverUrl
        )
    }

    static preconfiguredFromJson(json: any): Connection {
        return new Connection(
            json.id,
            json.name,
            true,
            json.serverUrl
        )
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
        } catch (e) {
            throw new UnexpectedError('Server URL is not valid URL.')
        }
        return url.endsWith('/') ? url.substring(0, url.length - 1) : url
    }
}
