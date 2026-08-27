import {
    mutationConverterRegistry
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/mutation/MutationConverterRegistry.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    GrpcSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'

import {
    CreateSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/CreateSortableAttributeCompoundSchemaMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/ModifySortableAttributeCompoundSchemaDescriptionMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/ModifySortableAttributeCompoundSchemaNameMutationConverter.ts'
import {
    RemoveSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/RemoveSortableAttributeCompoundSchemaMutationConverter.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortable-attribute-compound/ReferenceSortableAttributeCompoundSchemaMutation.ts'


export class DelegatingSortableAttributeCompoundSchemaMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = mutationConverterRegistry<ReferenceSortableAttributeCompoundSchemaMutation>([
        ['createSortableAttributeCompoundSchemaMutation',
            CreateSortableAttributeCompoundSchemaMutationConverter.INSTANCE
        ],
        ['modifySortableAttributeCompoundSchemaDeprecationNoticeMutation',
            ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter.INSTANCE
        ],
        ['modifySortableAttributeCompoundSchemaDescriptionMutation',
            ModifySortableAttributeCompoundSchemaDescriptionMutationConverter.INSTANCE
        ],
        ['modifySortableAttributeCompoundSchemaNameMutation',
            ModifySortableAttributeCompoundSchemaNameMutationConverter.INSTANCE
        ],
        ['removeSortableAttributeCompoundSchemaMutation',
            RemoveSortableAttributeCompoundSchemaMutationConverter.INSTANCE
        ],

    ])

    static convert(mutation: GrpcSortableAttributeCompoundSchemaMutation | undefined): ReferenceSortableAttributeCompoundSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingSortableAttributeCompoundSchemaMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

