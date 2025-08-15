import { CatalogEvolutionMode } from '@/modules/database-driver/request-response/cdc/CatalogEvolutionMode.ts'
import { List as ImmutableList } from 'immutable'
import { GrpcCatalogEvolutionMode } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'

export class CatalogEvolutionModeConverter {
    convertCatalogEvolutionModes(catalogEvolutionModes: GrpcCatalogEvolutionMode[]): ImmutableList<CatalogEvolutionMode> {
        const newCatalogEvolutionModes: CatalogEvolutionMode[] = []

        for (const catalogEvolutionMode of catalogEvolutionModes) {
            newCatalogEvolutionModes.push(this.convertCatalogEvolutionMode(catalogEvolutionMode))
        }

        return ImmutableList(newCatalogEvolutionModes)
    }
    convertCatalogEvolutionMode(catalogEvolutionMode: GrpcCatalogEvolutionMode):CatalogEvolutionMode {
        switch (catalogEvolutionMode) {
            case GrpcCatalogEvolutionMode.ADDING_ENTITY_TYPES:
                return CatalogEvolutionMode.AddingEntityTypes
            default:
                throw new Error('Unaccepted evolution mode')
        }
    }
}
