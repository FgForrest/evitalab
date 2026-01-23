// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EntityMutation {}

export enum EntityExistence { // todo pfi: move to another ts file
    MustNotExist= "mustNotExist",
    MayExist = "mayExist",
    MustExist = "mustExist",
}
