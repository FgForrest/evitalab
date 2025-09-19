import {
    GrpcChangeCaptureArea,
    GrpcChangeCaptureContainerType,
    type GrpcChangeCaptureCriteria,
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

export class MutationHistoryConverter {


    convertGrpcMutationHistory(changeCapture: GrpcChangeCatalogCapture): ChangeCatalogCapture {
        let mutation: Mutation | undefined // todo pfi: is possible to have it undefined?

        try {
            // ChangeCaptureConverter.toChangeCatalogCapture() // todo pfi:

            if (CatalogSchemaConverter.toCaptureArea(changeCapture.area) !== CaptureArea.Infrastructure &&
                (!changeCapture.body?.value?.mutation || !changeCapture.body?.value?.mutation.case)) { // todo pfi: remove me?
                console.error(`Issue with ${changeCapture.body}`)
                mutation = undefined
            } else if (CatalogSchemaConverter.toCaptureArea(changeCapture.area) == CaptureArea.Infrastructure && changeCapture.body.value) {
                mutation = DelegatingInfrastructureMutationConverter.convert(changeCapture.body.value as GrpcInfrastructureMutation);
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
            console.error(error)
            throw new UnexpectedError(`Unexpected error ${changeCapture.body.case}.`)
        }

        return new ChangeCatalogCapture(
            Number(changeCapture.version),
            changeCapture.index || 0,
            CatalogSchemaConverter.toCaptureArea(changeCapture.area),
            changeCapture.entityType,
            changeCapture.entityPrimaryKey,
            CatalogSchemaConverter.toOperation(changeCapture.operation),
            mutation
        )


    }


    convertMutationHistoryRequest(mutationHistoryRequest: MutationHistoryRequest): GrpcChangeCaptureCriteria[] {
        return [
            {
                area: GrpcChangeCaptureArea.INFRASTRUCTURE
            },
            {
                site: {
                    value: {
                        containerType: [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
                    },
                    case: 'dataSite'
                }
            },
            {
                site: {
                    value: {
                        containerType: [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
                    },
                    case: 'schemaSite'
                }
            }
        ]
    }

}
