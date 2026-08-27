import { toJson } from '@bufbuild/protobuf'
import type { DescMessage, JsonObject, MessageShape } from '@bufbuild/protobuf'

/**
 * Converts a received gRPC message into its canonical protobuf JSON form, which is what any diagnostic view of raw
 * server data (the console raw result, the traffic viewer mutation body) renders.
 *
 * `JSON.stringify` cannot be used on a message directly: 64-bit fields without the `JS_STRING` marker are `bigint`
 * and make it throw, `bytes` fields turn into an object of numeric keys, and every message carries the internal
 * `$typeName` property. The canonical form has none of those problems - long values become strings, binary data
 * base64, enums their names.
 *
 * Fields at their default value are emitted as well, because a view of raw server data must not silently omit
 * anything the response contains.
 *
 * The canonical form is stricter than the wire, though: a timestamp is written as an RFC 3339 string and a value
 * outside the years 0001-9999 has no such form, so the conversion of an extreme date-time is rejected. Rather than
 * losing the whole view over one value, such a message degrades to the plain bigint-safe form - noisier, but it
 * renders.
 */
export function grpcMessageToJson<Desc extends DescMessage>(schema: Desc, message: MessageShape<Desc>): JsonObject {
    try {
        return toJson(schema, message, { alwaysEmitImplicit: true }) as JsonObject
    } catch {
        return JSON.parse(serializeJsonWithBigInt(message)) as JsonObject
    }
}

/**
 * Serializes an object of the internal model, which `JSON.stringify` alone cannot handle either: a timestamp keeps its
 * seconds as `bigint`, so anything holding a date-time value (a price validity, for example) makes it throw.
 *
 * Use {@link grpcMessageToJson} for gRPC messages - it produces the canonical form of the wire data instead.
 */
export function serializeJsonWithBigInt(value: object): string {
    return JSON.stringify(value, (_, value) => typeof value === 'bigint' ? value.toString() : value)
}
