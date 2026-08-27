/**
 * Expectation an entity mutation places on the existence of the mutated entity in the catalog.
 */
export enum EntityExistence {
    MustNotExist= "mustNotExist",
    MayExist = "mayExist",
    MustExist = "mustExist",
}
