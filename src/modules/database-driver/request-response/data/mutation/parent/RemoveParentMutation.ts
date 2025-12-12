import { ParentMutation } from '@/modules/database-driver/request-response/data/mutation/parent/ParentMutation.ts'

export  class RemoveParentMutation extends ParentMutation {
    static readonly TYPE = 'removeParentMutation' as const

}
