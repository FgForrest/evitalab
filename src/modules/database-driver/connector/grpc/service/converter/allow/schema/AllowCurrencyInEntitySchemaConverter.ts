//todo: lho
import type {
    GrpcAllowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    AllowCurrencyInEntitySchemaMutation
} from '@/modules/database-driver/request-response/cdc/AllowCurrencyInEntitySchemaMutation.ts'
import type {
    EvitaValueConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class AllowCurrencyInEntitySchemaConverter {
    private readonly evitaValueConverter: EvitaValueConverter

    constructor(evitaValueConverter: EvitaValueConverter) {
        this.evitaValueConverter = evitaValueConverter
    }

    convertAllowCurrencyInEntitySchema(allowCurrencyInEntitySchema: GrpcAllowCurrencyInEntitySchemaMutation): AllowCurrencyInEntitySchemaMutation {
        return new AllowCurrencyInEntitySchemaMutation(
            this.evitaValueConverter.convertGrpcCurrencyArray(allowCurrencyInEntitySchema.currencies)
        )
    }
}
