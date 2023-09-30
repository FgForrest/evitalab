import { DataGridDataPointer, QueryResult } from '@/model/editor/data-grid'
import { LabService } from '@/services/lab.service'

/**
 * Executes query against evitaDB server in language defined by implementation.
 */
export abstract class QueryExecutor {
    readonly labService: LabService

    protected constructor(labService: LabService) {
        this.labService = labService
    }

    /**
     * Executes a query against evitaDB server in language defined by implementation and returns formatted data.
     *
     * @param dataPointer points to a collection where to fetch data from
     * @param query pre-built query to execute in language defined by implementation
     */
    abstract executeQuery(dataPointer: DataGridDataPointer, query: string): Promise<QueryResult>

    /**
     * Deserializes property value to string displayable in the data grid to user.
     * @protected
     */
    protected deserializePropertyValue(value?: any): string {
        // return value
        if (value == undefined) {
            return ''
        }
        if (value instanceof Array) {
            return `[${value.map(it => this.deserializePropertyValue(it)).join(', ')}]`
        } else if (value instanceof Object) {
            return JSON.stringify(value)
        } else {
            return value.toString()
        }
    }
}
