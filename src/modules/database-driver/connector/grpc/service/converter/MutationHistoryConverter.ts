import type { GrpcChangeCatalogCapture } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
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

export class MutationHistoryConverter {


    convertGrpcMutationHistory(changeCapture: GrpcChangeCatalogCapture): ChangeCatalogCapture {

        // ChangeCaptureConverter.toChangeCatalogCapture() // todo pfi:
        let mutation: Mutation|undefined // todo pfi: is possible to have it undefined?

        if (!changeCapture.body?.value?.mutation || !changeCapture.body?.value?.mutation.case) {
            console.error(`Issue with ${changeCapture.body}`)
            mutation = undefined;
        } else if (changeCapture.body.case == 'schemaMutation') {
            mutation = DelegatingEntitySchemaMutationConverter.convert(changeCapture.body.value)
        } else if (changeCapture.body.case == 'entityMutation') {
            mutation = DelegatingEntityMutationConverter.convert(changeCapture.body.value)
        } else if (changeCapture.body.case == 'localMutation') {
            mutation = DelegatingLocalMutationConverter.convert(changeCapture.body.value)
        } else {
            throw new UnexpectedError(`Unexpected type ${changeCapture.body.case}.`)
        }

        return new ChangeCatalogCapture(
            Number(changeCapture.version),
            changeCapture.index,
            CatalogSchemaConverter.toCaptureArea(changeCapture.area),
            changeCapture.entityType,
            changeCapture.entityPrimaryKey,
            CatalogSchemaConverter.toOperation(changeCapture.operation),
            mutation
        )


    }
}
