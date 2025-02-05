/**
 * When 64-bit integer is needed for communication with server, this function limits unlimited bigint to 64-bits with
 * proper signed overflows
 */
export function limitToSigned64Bits(value: bigint): bigint {
    const limit: bigint = 1n << 63n
    const modValue: bigint = value % (limit << 1n)
    return modValue >= limit ? modValue - (limit << 1n) : modValue;
};
