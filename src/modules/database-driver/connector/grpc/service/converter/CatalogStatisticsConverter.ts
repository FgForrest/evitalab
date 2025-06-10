import { GrpcCatalogState } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import type {
    GrpcCatalogStatistics,
    GrpcEntityCollectionStatistics
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { List as ImmutableList } from 'immutable'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { EntityCollectionStatistics } from '@/modules/database-driver/request-response/EntityCollectionStatistics'

export class CatalogStatisticsConverter {
    convert(catalog: GrpcCatalogStatistics): CatalogStatistics {
        return new CatalogStatistics(
            JSON.stringify(catalog.catalogId),
            BigInt(catalog.catalogVersion),
            catalog.catalogName,
            this.convertEntityTypes(catalog.entityCollectionStatistics),
            catalog.corrupted,
            this.convertCatalogState(catalog.catalogState),
            BigInt(catalog.totalRecords),
            BigInt(catalog.indexCount),
            BigInt(catalog.sizeOnDiskInBytes)
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
    ): ImmutableList<EntityCollectionStatistics> {
        const newEntityTypes: EntityCollectionStatistics[] = []
        for (const entityType of entityTypes) {
            newEntityTypes.push(
                new EntityCollectionStatistics(
                    entityType.entityType,
                    entityType.totalRecords,
                    entityType.indexCount,
                    BigInt(entityType.sizeOnDiskInBytes)
                )
            )
        }
        return ImmutableList<EntityCollectionStatistics>(newEntityTypes);
    }
}
