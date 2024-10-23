import { List } from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

export class GroupByUtil {
    public static groupBy<T>(items: T[] | List<T>, key: keyof T): Grouped<T> {
        if (items instanceof Array) {
            return items.reduce((acc, obj) => {
                const property = obj[key]
                const groupKey =
                    property != undefined ? property.toString() : 'undefined'
                if (!acc[groupKey]) {
                    acc[groupKey] = []
                }
                acc[groupKey].push(obj)
                return acc
            }, {} as Grouped<T>)
        } else if (items instanceof List) {
            return items.reduce((acc, obj) => {
                const property = obj[key]
                const groupKey =
                    property != undefined ? property.toString() : 'undefined'
                if (!acc[groupKey]) {
                    acc[groupKey] = []
                }
                acc[groupKey].push(obj)
                return acc
            }, {} as Grouped<T>)
        } else {
            throw new UnexpectedError('Expected array or list.')
        }
    }
}

export type Grouped<T> = {
    [key: string]: T[]
}
