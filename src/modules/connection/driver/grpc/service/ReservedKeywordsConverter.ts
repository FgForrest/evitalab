import { GrpcReservedKeyword } from '@/modules/connection/driver/grpc/gen/GrpcEvitaManagementAPI_pb'
import Immutable from 'immutable'
import { ClassifierType } from '@/modules/connection/model/data-type/ClassifierType'
import { GrpcClassifierType } from '@/modules/connection/driver/grpc/gen/GrpcEnums_pb'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { Keyword } from '@/modules/connection/driver/grpc/model/Keyword'

/**
 * Converts gRPC server reserved keywords into evitaLab representation
 */
export class ReservedKeywordsConverter {

    convert(grpcReservedKeywords: GrpcReservedKeyword[]): Immutable.Map<ClassifierType, Immutable.List<Keyword>> {
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

        const immutableReservedKeywords: Map<ClassifierType, Immutable.List<Keyword>> = new Map()
        reservedKeywords.forEach((value, key) => immutableReservedKeywords.set(key, Immutable.List(value)))
        return Immutable.Map(immutableReservedKeywords)
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
