import { v4 as uuidv4 } from 'uuid'

/**
 * Represents unique identifier of a single evitaDB server connection.
 */
export type EvitaDBConnectionId = string

/**
 * Represents a connection to a single evitaDB server. This allows the user to fetch data from concrete evitaDB server.
 */
export class EvitaDBConnection {
    readonly id: EvitaDBConnectionId
    readonly name: string
    readonly preconfigured: boolean
    readonly labApiUrl: string
    readonly restUrl: string
    readonly gqlUrl: string

    constructor(id: EvitaDBConnectionId | undefined, name: string, preconfigured: boolean, labApiUrl: string, restUrl: string, gqlUrl: string) {
        this.id = id ? id : uuidv4()
        this.name = name
        this.preconfigured = preconfigured
        this.labApiUrl = this.normalizeApiUrl(labApiUrl)
        this.restUrl = this.normalizeApiUrl(restUrl)
        this.gqlUrl = this.normalizeApiUrl(gqlUrl)
    }

    static fromJson(json: any, preconfigured: boolean): EvitaDBConnection {
        return new EvitaDBConnection(json.id, json.name, preconfigured, json.labApiUrl, json.restUrl, json.gqlUrl)
    }

    private normalizeApiUrl(url: string): string {
        return url.endsWith('/') ? url.substring(0, url.length - 1) : url
    }
}

/**
 * Type of lab panel.
 */
export enum PanelType {
    Explorer = 'explorer'
}

/**
 * Defines languages that will be used to query data from evitaDB.
 */
export enum QueryLanguage {
    EvitaQL = 'evitaql',
    GraphQL = 'graphql'
}

/**
 * Represents a single evitaDB blog post.
 */
export type EvitaDBBlogPost = {
    title: string,
    perex: string,
    url: string,
    thumbnailUrl: string
}


/**
 * Base for all lab-specific errors.
 */
export abstract class LabError extends Error {
    readonly connection?: EvitaDBConnection

    protected readonly _detail?: string | undefined
    get detail(): string | undefined {
        return this._detail
    }

    protected constructor(name: string, connection: EvitaDBConnection | undefined, message: string, detail?: string) {
        super(detail ? `${message}: ${detail}` : message)
        this.name = name
        this.connection = connection
        this._detail = detail
    }
}

/**
 * Base lab-specific error indicated that something unexpected happened and user cannot do anything about it.
 */
export abstract class LabInternalError extends LabError {
    protected constructor(name: string, connection: EvitaDBConnection | undefined, message: string, detail?: string) {
        super(name, connection, message, detail)
    }

    get detail(): string {
        const parts: string[] = []
        if (this._detail !== undefined) {
            parts.push(this._detail)
        }
        if (this.stack !== undefined) {
            parts.push(this.stack)
        }
        return parts.join('\n\n')
    }
}

/**
 * Base lab-specific error indicated that the user did something wrong. It also means that the user can potentially fix the
 * problem themselves.
 */
export abstract class LabInvalidUsageError extends LabError {
    protected constructor(name: string, connection: EvitaDBConnection | undefined, message: string, detail?: string) {
        super(name, connection, message, detail)
    }
}

/**
 * Unexpected error that should never happen. We don't know what happened.
 */
export class UnexpectedError extends LabInternalError {
    constructor(connection: EvitaDBConnection | undefined, detail: string) {
        super(
            'UnexpectedError',
            connection,
            'Unexpected error occurred.',
            detail
        )
    }
}


/**
 * Thrown when request to evitaDB took too long.
 */
export class TimeoutError extends LabInvalidUsageError {
    constructor(connection: EvitaDBConnection | undefined) {
        super(
            'TimeoutError',
            connection,
            'Request timed out. Please check your connection settings.'
        )
    }
}

/**
 * Something went wrong with the server (evitaDB instance). We can't do anything about it.
 */
export class EvitaDBInstanceServerError extends LabInvalidUsageError {
    constructor(connection: EvitaDBConnection | undefined) {
        super(
            'EvitaDBInstanceCallError',
            connection,
            'Server error. Please check your evitaDB instance for more details.'
        )
    }
}

/**
 * Could not connect to the server (evitaDB instance). We can't do anything about it.
 */
export class EvitaDBInstanceNetworkError extends LabInvalidUsageError {
    constructor(connection: EvitaDBConnection | undefined) {
        super(
            'EvitaDBInstanceNetworkError',
            connection,
            `Could not connect to the '${connection?.name || 'unknown'}' instance. Please check your connection settings.`
        )
    }
}

/**
 * Indicates that the user tried to create a connection with a name that already exists.
 */
export class DuplicateEvitaDBConnectionError extends LabInvalidUsageError {
    constructor(name: string) {
        super(
            'DuplicateEvitaDBConnectionError',
            undefined,
            `Connection with name '${name}' already exists.`
        )
    }
}
