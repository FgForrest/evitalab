import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    GrpcSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'

import {
    CreateSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/CreateSortableAttributeCompoundSchemaMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDescriptionMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaNameMutationConverter.ts'
import {
    RemoveSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/RemoveSortableAttributeCompoundSchemaMutationConverter.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'


export class DelegatingSortableAttributeCompoundSchemaMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>([ // todo pfi: replace any
        ['createSortableAttributeCompoundSchemaMutation',
            CreateSortableAttributeCompoundSchemaMutationConverter
        ],
        ['modifySortableAttributeCompoundSchemaDeprecationNoticeMutation',
            ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter
        ],
        ['modifySortableAttributeCompoundSchemaDescriptionMutation',
            ModifySortableAttributeCompoundSchemaDescriptionMutationConverter
        ],
        ['modifySortableAttributeCompoundSchemaNameMutation',
            ModifySortableAttributeCompoundSchemaNameMutationConverter
        ],
        ['removeSortableAttributeCompoundSchemaMutation',
            RemoveSortableAttributeCompoundSchemaMutationConverter
        ],

    ])

    static convert(mutation: GrpcSortableAttributeCompoundSchemaMutation | undefined): ReferenceSortableAttributeCompoundSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const conversionDescriptor = this.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!conversionDescriptor) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return mutation.mutation.value
    }
}

