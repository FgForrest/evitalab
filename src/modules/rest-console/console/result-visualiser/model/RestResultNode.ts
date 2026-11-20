/**
 * A raw node of a REST JSON response that is walked dynamically before being turned into the visualiser models.
 *
 * The visualised responses (`query*` operations) have a fixed but deeply nested shape, which is read by property
 * name only where it is needed. This alias documents that boundary in one place instead of scattering `any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamically-walked REST JSON result node
export type RestResultNode = Record<string, any>
