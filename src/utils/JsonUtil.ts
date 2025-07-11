/**
 * JsonUtil allows serialize object with bigint
 * Source: https://stackoverflow.com/questions/65152373/serialize-bigint-in-json
 */
export function serializeJsonWithBigInt(value: object): string {
    return JSON.stringify(value, (_, value) => typeof value === `bigint` ? value.toString() : value)
}
