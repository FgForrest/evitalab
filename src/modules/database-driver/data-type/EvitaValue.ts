/**
 * A single evitaDB data value (attribute value, associated-data value, ...).
 *
 * evitaDB values are heterogeneous — any supported scalar, array, range, locale,
 * currency, big-decimal, date-time, etc. There is no single static shape; the
 * concrete type is resolved dynamically at the display/formatting boundary. This
 * alias documents that intent in one place instead of scattering `any` across the
 * value-carrying model and converters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- heterogeneous dynamic evitaDB value; narrowed at the display boundary
export type EvitaValue = any
