// import { Connection } from '@/model/connection'

export const dataContentTypeHeader = 'application/json'
export const dataAcceptHeader = 'application/json'

export const schemaContentTypeHeader = 'application/yaml'
export const schemaAcceptHeader = 'application/yaml'

/**
 * Points to concrete evitaDB GraphQL instance
 */
export class RestInstancePointer {
//     readonly connection: Connection
//     readonly catalogName: string
//     readonly collectionName: string
//     readonly instanceType: RestInstanceType
//
//     constructor(connection: Connection, catalogName: string, instanceType: GraphQLInstanceType) {
//         this.connection = connection
//         this.catalogName = catalogName
//         this.instanceType = instanceType
//     }
//
//     url(): string {
//         // todo lho proper catalog name notation
//         return `${this.connection.restUrl}/${this.catalogName}/${this.collectionName}/${this.instanceTypeSuffix()}`
//     }
//
//     openApiUrl(): string {
//         // todo lho proper catalog name notation
//         return `${this.connection.restUrl}/${this.catalogName}/${this.collectionName}`
//     }
//
//     private instanceTypeSuffix(): string {
//         switch (this.instanceType) {
//
//         }
//     }
}

// export enum RestInstanceType{
//     DATA = 'data',
//     SCHEMA = 'schema'
// }
