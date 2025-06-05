import { GrpcReservedKeyword } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaManagementAPI_pb'
import { Map as ImmutableMap, List as ImmutableList } from 'immutable'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import { GrpcClassifierType } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Keyword } from '@/modules/database-driver/connector/grpc/model/Keyword'

/**
 * Converts gRPC server reserved keywords into evitaLab representation
 */
export class ReservedKeywordsConverter {

    convert(grpcReservedKeywords: GrpcReservedKeyword[]): ImmutableMap<ClassifierType, ImmutableList<Keyword>> {
        const reservedKeywords: Map<ClassifierType, Keyword[]> = new Map()
        for (const grpcReservedKeyword of grpcReservedKeywords) {
            const classifierType: ClassifierType = this.convertClassifierType(grpcReservedKeyword.classifierType)
            let reservedKeywordsForClassifierType: Keyword[] | undefined = reservedKeywords.get(classifierType)
            if (reservedKeywordsForClassifierType == undefined) {
                reservedKeywordsForClassifierType = []
                reservedKeywords.set(classifierType, reservedKeywordsForClassifierType)
            }
            reservedKeywordsForClassifierType.push(this.convertReservedKeyword(grpcReservedKeyword))
        }

        const immutableReservedKeywords: Map<ClassifierType, ImmutableList<Keyword>> = new Map()
        reservedKeywords.forEach((value, key) => immutableReservedKeywords.set(key, ImmutableList(value)))
        return ImmutableMap(immutableReservedKeywords)
    }

    private convertClassifierType(grpcClassifierType: GrpcClassifierType): ClassifierType {
        switch (grpcClassifierType) {
            case GrpcClassifierType.CLASSIFIER_TYPE_SERVER_NAME: return ClassifierType.ServerName
            case GrpcClassifierType.CLASSIFIER_TYPE_CATALOG: return ClassifierType.Catalog
            case GrpcClassifierType.CLASSIFIER_TYPE_ENTITY: return ClassifierType.Entity
            case GrpcClassifierType.CLASSIFIER_TYPE_ATTRIBUTE: return ClassifierType.Attribute
            case GrpcClassifierType.CLASSIFIER_TYPE_ASSOCIATED_DATA: return ClassifierType.AssociatedData
            case GrpcClassifierType.CLASSIFIER_TYPE_REFERENCE: return ClassifierType.Reference
            case GrpcClassifierType.CLASSIFIER_TYPE_REFERENCE_ATTRIBUTE: return ClassifierType.ReferenceAttribute
            default: throw new UnexpectedError(`Unsupported classifier type '${grpcClassifierType}'.`)
        }
    }

    private convertReservedKeyword(grpcReservedKeyword: GrpcReservedKeyword): Keyword {
        return new Keyword(grpcReservedKeyword.words)
    }
}
