import type {
    GrpcAttributeElement
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb.ts'
import {
    AttributeElement
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'
import { GrpcOrderBehaviour, GrpcOrderDirection } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { OrderBehaviour } from '@/modules/database-driver/request-response/schema/OrderBehaviour.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection.ts'

export class EntitySchemaConverter {

    static toAttributeElement(
        attributeElements: GrpcAttributeElement[]
    ): AttributeElement[] {
        return attributeElements.map((it) => this.convertAttributeElement(it))
    }

    static convertAttributeElement(
        attributeElement: GrpcAttributeElement
    ): AttributeElement {
        return new AttributeElement(
            attributeElement.attributeName,
            EntitySchemaConverter.convertOrderBehaviour(attributeElement.behaviour),
            EntitySchemaConverter.convertOrderDirection(attributeElement.direction)
        )
    }

    static convertOrderBehaviour(
        orderBehaviour: GrpcOrderBehaviour
    ): OrderBehaviour {
        switch (orderBehaviour) {
            case GrpcOrderBehaviour.NULLS_FIRST:
                return OrderBehaviour.NullsFirst
            case GrpcOrderBehaviour.NULLS_LAST:
                return OrderBehaviour.NullsLast
            default:
                throw new UnexpectedError(
                    `Unsupported order behaviour '${String(orderBehaviour)}'.`
                )
        }
    }

    static convertOrderDirection(
        orderDirection: GrpcOrderDirection
    ): OrderDirection {
        switch (orderDirection) {
            case GrpcOrderDirection.ASC:
                return OrderDirection.Desc
            case GrpcOrderDirection.DESC:
                return OrderDirection.Desc
            default:
                throw new UnexpectedError(
                    `Unsupported order direction '${String(orderDirection)}'.`
                )
        }
    }


}
