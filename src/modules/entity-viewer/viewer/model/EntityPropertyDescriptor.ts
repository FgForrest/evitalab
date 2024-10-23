import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { List as ImmutableList } from 'immutable'
import { Schema } from '@/modules/connection/model/schema/Schema'
import { isSortableSchema } from '@/modules/connection/model/schema/SortableSchema'
import { isLocalizedSchema } from '@/modules/connection/model/schema/LocalizedSchema'
import { sortableStaticEntityProperties } from '@/modules/entity-viewer/viewer/component/dependencies'


/**
 * Full description of a single entity property
 */
export class EntityPropertyDescriptor {
    readonly type: EntityPropertyType
    readonly key: EntityPropertyKey
    readonly title: string
    readonly flattenedTitle: string
    readonly parentSchema: Schema | undefined
    readonly schema: Schema | undefined
    readonly children: ImmutableList<EntityPropertyDescriptor>

    constructor(type: EntityPropertyType,
                key: EntityPropertyKey,
                title: string,
                flattenedTitle: string,
                parentSchema: any | undefined,
                schema: any | undefined,
                children: ImmutableList<EntityPropertyDescriptor>) {
        this.type = type
        this.key = key
        this.title = title
        this.flattenedTitle = flattenedTitle
        this.parentSchema = parentSchema
        this.schema = schema
        this.children = children
    }

    isSortable(): boolean {
        return sortableStaticEntityProperties.includes(this.key.toString()) ||
            (this.schema != undefined && isSortableSchema(this.schema) && this.schema.sortable.getOrElse(false)) ||
            false
    }

    isLocalized(): boolean {
        return (this.schema != undefined && isLocalizedSchema(this.schema) && this.schema.localized.getOrElse(false)) ||
            false
    }
}
