import { VisualiserTypeType } from '@/modules/console/result-visualiser/model/VisualiserTypeType'

/**
 * Descriptor of what is supported to visualise.
 */
export class VisualiserType {
    readonly title: string
    readonly value: VisualiserTypeType

    constructor(title: string, value: VisualiserTypeType){
        this.title = title
        this.value = value
    }
}
