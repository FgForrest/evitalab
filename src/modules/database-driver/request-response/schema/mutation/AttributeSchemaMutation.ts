import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export interface AttributeSchemaMutation extends SchemaMutation {

    /**
     * Returns the name of the attribute.
     */
    getName(): string


}
