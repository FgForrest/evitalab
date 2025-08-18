import {
    GrpcEntityScope,
    GrpcGlobalAttributeUniquenessType
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { List as ImmutableList } from 'immutable'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    GrpcScopedAttributeUniquenessType,
    GrpcScopedGlobalAttributeUniquenessType
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb.ts'
import {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import {
    ScopedGlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedGlobalAttributeUniquenessType.ts'
import {
    GlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/GlobalAttributeUniquenessType.ts'
import {
    AttributeUniquenessTypeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/AttributeUniquenessTypeConverter.ts'

export class ScopesConverter {
    private readonly attributeUniquenessTypeConvertor: AttributeUniquenessTypeConverter

    constructor(attributeUniquenessTypeConvertor: AttributeUniquenessTypeConverter) {
        this.attributeUniquenessTypeConvertor = attributeUniquenessTypeConvertor
    }

    convertEntityScopes(entityScopes: GrpcEntityScope[]): ImmutableList<EntityScope> {
        const convertedEntityScopes: EntityScope[] = []

        for (const entityScope of entityScopes) {
            convertedEntityScopes.push(this.convertEntityScope(entityScope))
        }
        return ImmutableList(convertedEntityScopes)
    }

    convertEntityScope(entityScope: GrpcEntityScope): EntityScope {
        switch (entityScope) {
            case GrpcEntityScope.SCOPE_ARCHIVED:
                return EntityScope.Archive
            case GrpcEntityScope.SCOPE_LIVE:
                return EntityScope.Live
            default:
                throw new UnexpectedError('Unexpected entity scope')
        }
    }

    convertScopedGlobalAttributeUniquenessTypes(scopedGlobalAttributeUniquenessTypes: GrpcScopedGlobalAttributeUniquenessType[]):ImmutableList<ScopedGlobalAttributeUniquenessType> {
        const convertedScopedGlobalAttributeUniquenessTypes: ScopedGlobalAttributeUniquenessType[] = []
        for (const entityScope of scopedGlobalAttributeUniquenessTypes) {
            convertedScopedGlobalAttributeUniquenessTypes.push(this.convertScopedGlobalAttributeUniquenessType(entityScope))
        }
        return ImmutableList(convertedScopedGlobalAttributeUniquenessTypes)
    }

    convertScopedGlobalAttributeUniquenessType(scopedGlobalAttributeUniquenessType: GrpcScopedGlobalAttributeUniquenessType): ScopedGlobalAttributeUniquenessType {
        return new ScopedGlobalAttributeUniquenessType(this.convertEntityScope(scopedGlobalAttributeUniquenessType.scope), this.convertGlobalAttributeUniquenessType(scopedGlobalAttributeUniquenessType.uniquenessType))
    }


    convertUniqueInScopes(uniqueGloballyInScopes: GrpcScopedAttributeUniquenessType[]):ImmutableList<ScopedAttributeUniquenessType>{
        const scopes: ScopedAttributeUniquenessType[] = []
        for (const uniqueGloballyInScope of uniqueGloballyInScopes) {
            scopes.push(new ScopedAttributeUniquenessType(this.convertEntityScope(uniqueGloballyInScope.scope), this.attributeUniquenessTypeConvertor.convertAttributeUniquenessType(uniqueGloballyInScope.uniquenessType)))
        }

        return ImmutableList(scopes)
    }

    convertUniqueGloballyInScopes(uniqueGloballyInScopes: GrpcScopedGlobalAttributeUniquenessType[]):ImmutableList<ScopedGlobalAttributeUniquenessType>{
        const scopes: ScopedGlobalAttributeUniquenessType[] = []
        for (const uniqueGloballyInScope of uniqueGloballyInScopes) {
            scopes.push(new ScopedGlobalAttributeUniquenessType(this.convertEntityScope(uniqueGloballyInScope.scope), this.convertGlobalAttributeUniquenessType(uniqueGloballyInScope.uniquenessType)))
        }

        return ImmutableList(scopes)
    }

    private convertGlobalAttributeUniquenessType(
        globalAttributeUniquenessType: GrpcGlobalAttributeUniquenessType
    ): GlobalAttributeUniquenessType {
        switch (globalAttributeUniquenessType) {
            case GrpcGlobalAttributeUniquenessType.NOT_GLOBALLY_UNIQUE:
                return GlobalAttributeUniquenessType.NotUnique
            case GrpcGlobalAttributeUniquenessType.UNIQUE_WITHIN_CATALOG:
                return GlobalAttributeUniquenessType.UniqueWithinCatalog
            case GrpcGlobalAttributeUniquenessType.UNIQUE_WITHIN_CATALOG_LOCALE:
                return GlobalAttributeUniquenessType.UniqueWithinCatalogLocale
            default:
                throw new UnexpectedError(
                    `Unsupported global attribute uniqueness type '${globalAttributeUniquenessType}'.`
                )
        }
    }
}
