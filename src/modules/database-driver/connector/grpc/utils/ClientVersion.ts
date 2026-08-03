/**
 * Name of the gRPC header evitaDB reads the supported API version from. Based on it, the server decides which form
 * of a response it can send to the client (e.g. the form of complex associated data values).
 */
export const clientVersionHeader: string = 'clientVersion'

/**
 * evitaDB parses the declared version without any error handling, therefore only a version it can parse
 * (`major.minor[.patch][-SNAPSHOT]`) may be sent - anything else would fail every single gRPC call.
 */
const parsableClientVersionPattern: RegExp = /^\d+\.\d+(?:\.\w+)?(?:-SNAPSHOT)?$/

/**
 * Validates the evitaDB API version evitaLab supports before it is declared to the server. Returns `undefined`
 * for a version the server wouldn't be able to parse, in which case no version is declared at all and the server
 * falls back to the oldest supported response forms.
 */
export function resolveClientVersion(rawClientVersion: string | undefined): string | undefined {
    if (rawClientVersion == undefined) {
        return undefined
    }
    const clientVersion: string = rawClientVersion.trim()
    return parsableClientVersionPattern.test(clientVersion) ? clientVersion : undefined
}
