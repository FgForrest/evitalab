/**
 * A raw node of a GraphQL JSON result that is walked dynamically (by property
 * name / entity-property type) before being flattened into the internal model.
 *
 * GraphQL responses have no single static shape at this layer — the selection
 * set is built at runtime — so nodes are indexed dynamically. This alias
 * documents that boundary in one place instead of scattering `any`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamically-walked GraphQL JSON result node
export type GraphQLResultNode = Record<string, any>
