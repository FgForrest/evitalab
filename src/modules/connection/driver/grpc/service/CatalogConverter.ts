import { GrpcCatalogState } from '@/modules/connection/driver/grpc/gen/GrpcEnums_pb'
import {
    GrpcCatalogStatistics,
    GrpcEntityCollectionStatistics
} from '@/modules/connection/driver/grpc/gen/GrpcEvitaDataTypes_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Catalog } from '@/modules/connection/model/Catalog'
import { CatalogState } from '@/modules/connection/model/CatalogState'
import { EntityCollection } from '@/modules/connection/model/EntityCollection'
import Immutable from 'immutable'

//TODO: Add documentation
export class CatalogConverter {
    convert(catalog: GrpcCatalogStatistics): Catalog {
        return new Catalog(
            catalog.catalogId?.toJsonString(),
            catalog.catalogVersion,
            catalog.catalogName,
            this.convertEntityTypes(catalog.entityCollectionStatistics),
            catalog.corrupted,
            this.convertCatalogState(catalog.catalogState),
            catalog.totalRecords,
            catalog.indexCount,
            catalog.sizeOnDiskInBytes
        )
    }

    private convertCatalogState(catalogState: GrpcCatalogState): CatalogState {
        switch (catalogState) {
            case GrpcCatalogState.UNKNOWN_CATALOG_STATE:
                return CatalogState.Unknown
            case GrpcCatalogState.WARMING_UP:
                return CatalogState.WarmingUp
            case GrpcCatalogState.ALIVE:
                return CatalogState.Alive
            default:
                throw new UnexpectedError(
                    `Unsupported catalog state '${catalogState}'.`
                )
        }
    }

    private convertEntityTypes(
        entityTypes: GrpcEntityCollectionStatistics[]
    ): Immutable.List<EntityCollection> {
        const newEntityTypes: EntityCollection[] = []
        for (const entityType of entityTypes) {
            newEntityTypes.push(
                new EntityCollection(
                    entityType.entityType,
                    entityType.totalRecords,
                    entityType.indexCount,
                    entityType.sizeOnDiskInBytes
                )
            )
        }
        return Immutable.List<EntityCollection>(newEntityTypes);
    }
}
