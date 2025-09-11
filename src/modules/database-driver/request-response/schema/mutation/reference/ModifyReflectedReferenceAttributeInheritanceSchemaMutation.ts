import {
    AbstractModifyReferenceDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/AbstractModifyReferenceDataSchemaMutation.ts'
import {
    type AttributeInheritanceBehavior
} from '@/modules/database-driver/request-response/schema/AttributeInheritanceBehavior.ts'
import Immutable, { List as ImmutableList } from 'immutable'

export class ModifyReflectedReferenceAttributeInheritanceSchemaMutation extends AbstractModifyReferenceDataSchemaMutation {
    readonly requiredRangeAfterApplication: AttributeInheritanceBehavior
    readonly attributeInheritanceFilter: ImmutableList<string>


    constructor(name: string, requiredRangeAfterApplication: AttributeInheritanceBehavior, attributeInheritanceFilter: Immutable.List<string>) {
        super(name)
        this.requiredRangeAfterApplication = requiredRangeAfterApplication
        this.attributeInheritanceFilter = attributeInheritanceFilter
    }
}
