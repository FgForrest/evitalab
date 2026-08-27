import {
    GrpcChangeCaptureArea, GrpcChangeCaptureContainerType,
    type GrpcChangeCaptureCriteria, GrpcChangeCaptureOperation,
    type GrpcChangeCatalogCapture
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import {
    DelegatingLocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/DelegatingLocalMutationConverter.ts'
import {
    DelegatingEntityMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/DelegatingEntityMutationConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    DelegatingEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingEntitySchemaMutationConverter.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'
import type { MutationHistoryRequest } from '@/modules/history-viewer/model/MutationHistoryRequest.ts'
import {
    DelegatingInfrastructureMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingInfrastructureMutationConverter.ts'
import type {
    GrpcInfrastructureMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcInfrastrutureMutation_pb.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import { errorMessage } from '@/utils/error.ts'

export class MutationHistoryConverter {


    /**
     * A capture without a body is legal even though the history is always requested with the body content: the gRPC
     * body carries entity, local, entity schema and infrastructure mutations only, and a catalog-scoped schema
     * mutation (a catalog description change, a global attribute change, ...) has no case among them. The server
     * leaves the body unset for those, and the record is rendered from its header alone.
     */
    convertGrpcMutationHistory(changeCapture: GrpcChangeCatalogCapture): ChangeCatalogCapture {
        const area: CaptureArea = CatalogSchemaConverter.toCaptureArea(changeCapture.area)
        let mutation: Mutation | undefined

        try {
            if (area !== CaptureArea.Infrastructure &&
                (!changeCapture.body?.value?.mutation || !changeCapture.body?.value?.mutation.case)) {
                mutation = undefined
            } else if (area == CaptureArea.Infrastructure && changeCapture.body.value) {
                mutation = DelegatingInfrastructureMutationConverter.convert(changeCapture.body.value as GrpcInfrastructureMutation)
            } else if (changeCapture.body.case == 'schemaMutation') {
                mutation = DelegatingEntitySchemaMutationConverter.convert(changeCapture.body.value)
            } else if (changeCapture.body.case == 'entityMutation') {
                mutation = DelegatingEntityMutationConverter.convert(changeCapture.body.value)
            } else if (changeCapture.body.case == 'localMutation') {
                mutation = DelegatingLocalMutationConverter.convert(changeCapture.body.value)
            } else {
                throw new UnexpectedError(`Unexpected type ${changeCapture.body.case}.`)
            }
        } catch (error) {
            throw new UnexpectedError(
                `Could not convert mutation history capture (catalog version: ${changeCapture.version}, ` +
                `index: ${changeCapture.index}, area: ${area}, body: ${changeCapture.body.case}): ${errorMessage(error)}`
            )
        }

        return new ChangeCatalogCapture(
            Number(changeCapture.version),
            changeCapture.index || 0,
            area,
            changeCapture.entityType,
            changeCapture.entityPrimaryKey !== undefined ? changeCapture.entityPrimaryKey : (changeCapture.body.case === 'entityMutation' ? changeCapture.body.value?.mutation?.value?.entityPrimaryKey : undefined),
            CatalogSchemaConverter.toOperation(changeCapture.operation),
            mutation,
            changeCapture.timestamp !== undefined ? EvitaValueConverter.convertGrpcOffsetDateTime(changeCapture.timestamp) : undefined
        )


    }

    toContainerType(input: (GrpcChangeCaptureContainerType | string)[]): GrpcChangeCaptureContainerType[] {
        return input.map(it => typeof it === 'string' ? GrpcChangeCaptureContainerType[it as keyof typeof GrpcChangeCaptureContainerType] : it)
    }

    toMutationType(input: (GrpcChangeCaptureOperation | string)[]): GrpcChangeCaptureOperation[] {
        return input.map(it => typeof it === 'string' ? GrpcChangeCaptureOperation[it as keyof typeof GrpcChangeCaptureOperation] : it)
    }

    convertMutationHistoryRequest(mutationHistoryRequest: MutationHistoryRequest): GrpcChangeCaptureCriteria[] {
        const criteria: GrpcChangeCaptureCriteria[] = []



        const dataSite = {
            area: GrpcChangeCaptureArea.DATA,
            site: {
                value: {
                    entityType: mutationHistoryRequest.entityType,
                    entityPrimaryKey: mutationHistoryRequest.entityPrimaryKey,
                    containerType: this.toContainerType(mutationHistoryRequest.containerTypeList),
                    operation: this.toMutationType(mutationHistoryRequest.operationList),
                    containerName: [...mutationHistoryRequest.containerNameList]
                },
                case: 'dataSite'
            }
        } as GrpcChangeCaptureCriteria
        const schemaSite = {
            area: GrpcChangeCaptureArea.SCHEMA,
            site: {
                value: {
                    entityType: mutationHistoryRequest.entityType,
                    containerType: this.toContainerType(mutationHistoryRequest.containerTypeList),
                    operation: mutationHistoryRequest.operationList
                },
                case: 'schemaSite'
            }
        } as GrpcChangeCaptureCriteria


        if (mutationHistoryRequest.infrastructureAreaType === 'DATA_SITE') {
            criteria.push(dataSite)
        } else if (mutationHistoryRequest.infrastructureAreaType === 'SCHEMA_SITE') {
            criteria.push(schemaSite)
        } else {
            // both
            criteria.push(dataSite)
            criteria.push(schemaSite)
        }
        return criteria
    }

}
