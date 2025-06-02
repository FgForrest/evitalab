import { GrpcCatalogState } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import {
    GrpcCatalogStatistics,
    GrpcEntityCollectionStatistics
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import Immutable from 'immutable'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'

export class CatalogStatisticsConverter {
    convert(catalog: GrpcCatalogStatistics): CatalogStatistics {
        return new CatalogStatistics(
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

    convertCatalogState(catalogState: GrpcCatalogState): CatalogState {
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
    ): Immutable.List<EntityCollectionStatistics> {
        const newEntityTypes: EntityCollectionStatistics[] = []
        for (const entityType of entityTypes) {
            newEntityTypes.push(
                new EntityCollectionStatistics(
                    entityType.entityType,
                    entityType.totalRecords,
                    entityType.indexCount,
                    entityType.sizeOnDiskInBytes
                )
            )
        }
        return Immutable.List<EntityCollectionStatistics>(newEntityTypes);
    }
}
