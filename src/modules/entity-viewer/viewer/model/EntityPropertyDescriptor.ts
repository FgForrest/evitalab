import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { List as ImmutableList } from 'immutable'
import type { Schema } from '@/modules/database-driver/request-response/schema/Schema'
import { isSortableSchema } from '@/modules/database-driver/request-response/schema/SortableSchema'
import { isLocalizedSchema } from '@/modules/database-driver/request-response/schema/LocalizedSchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import type { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
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
                parentSchema: Schema | undefined,
                schema: Schema | undefined,
                children: ImmutableList<EntityPropertyDescriptor>) {
        this.type = type
        this.key = key
        this.title = title
        this.flattenedTitle = flattenedTitle
        this.parentSchema = parentSchema
        this.schema = schema
        this.children = children
    }

    /**
     * Whether entities can be sorted by this property within all of the given scopes. evitaDB requires the sortable
     * trait in every requested scope, so a property sortable in only some of them cannot be used for ordering.
     * Reference attributes additionally require the owning reference to be indexed in every requested scope.
     *
     * @param scopes scopes the grid currently queries; an empty list means no scope restriction applies
     */
    isSortable(scopes: EntityScope[]): boolean {
        if (sortableStaticEntityProperties.includes(this.key.toString())) {
            return true
        }
        if (this.schema == undefined || !isSortableSchema(this.schema)) {
            return false
        }
        const sortableInScopes: ImmutableList<EntityScope> = this.schema.sortableInScopes
        if (sortableInScopes == undefined || !scopes.every(scope => sortableInScopes.includes(scope))) {
            return false
        }
        if (this.type === EntityPropertyType.ReferenceAttributes) {
            const referenceSchema: Schema | undefined = this.parentSchema
            if (!(referenceSchema instanceof ReferenceSchema)) {
                return false
            }
            return scopes.every(scope => referenceSchema.isIndexedInScope(scope))
        }
        return true
    }

    isLocalized(): boolean {
        return (this.schema != undefined && isLocalizedSchema(this.schema) && this.schema.localized) ||
            false
    }
}
