import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Actual specific value of a property representing a 0-100 % progress.
 */
export class ProgressValue {
    /**
     * Actual progress 0 - 100
     */
    readonly progress: number
    readonly indeterminate: boolean = false

    constructor(progress: number, indeterminate: boolean = false) {
        if (progress < 0 && progress > 100) {
            throw new UnexpectedError(`Progress value ${progress} is not valid.`)
        }
        this.progress = progress
        this.indeterminate = indeterminate
    }

    toString() {
        if (this.indeterminate) {
            return '∞ %'
        }
        return `${this.progress} %`
    }
}
