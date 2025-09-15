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
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class CatalogStatisticsConverter {

    constructor() {
    }

    convert(catalog: GrpcCatalogStatistics): CatalogStatistics {
        return new CatalogStatistics(
            catalog.catalogId ? EvitaValueConverter.convertGrpcUuid(catalog.catalogId).toString() : undefined,
            BigInt(catalog.catalogVersion),
            catalog.catalogName,
            this.convertEntityTypes(catalog.entityCollectionStatistics),
            this.convertCatalogState(catalog.catalogState),
            BigInt(catalog.totalRecords),
            BigInt(catalog.indexCount),
            BigInt(catalog.sizeOnDiskInBytes),
            catalog.readOnly,
            catalog.unusable
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
            case GrpcCatalogState.BEING_ACTIVATED:
                return CatalogState.BeingActivated
            case GrpcCatalogState.BEING_CREATED:
                return CatalogState.BeingCreated
            case GrpcCatalogState.BEING_DEACTIVATED:
                return CatalogState.BeingDeactivated
            case GrpcCatalogState.BEING_DELETED:
                return CatalogState.BeingDeleted
            case GrpcCatalogState.CORRUPTED:
                return CatalogState.Corrupted
            case GrpcCatalogState.GOING_ALIVE:
                return CatalogState.GoingAlive
            case GrpcCatalogState.INACTIVE:
                return CatalogState.Inactive
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
