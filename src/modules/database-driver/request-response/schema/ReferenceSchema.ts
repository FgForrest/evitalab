import { List, Map } from 'immutable'
import { NamingConvention } from '../NamingConvetion'
import { AbstractSchema } from '@/modules/database-driver/request-response/schema/AbstractSchema'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { Flag } from '@/modules/schema-viewer/viewer/model/Flag.ts'
import { useI18n } from 'vue-i18n'
import { getEnumKeyByValue } from '@/utils/enum.ts'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'
import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import { ScopedExpression } from '@/modules/database-driver/request-response/schema/ScopedExpression.ts'
import {
    ScopedHistogramIndexDefinition
} from '@/modules/database-driver/request-response/schema/ScopedHistogramIndexDefinition.ts'
import {
    HistogramIndexDefinition
} from '@/modules/database-driver/request-response/schema/HistogramIndexDefinition.ts'


/**
 * evitaLab's representation of a single evitaDB reference schema independent of specific evitaDB version
 */
export class ReferenceSchema extends AbstractSchema {

    /**
     * Contains unique name of the model. Case-sensitive. Distinguishes one model item from another within single entity instance.
     * This is a mandatory value, it cannot be omitted.
     */
    readonly name: string
    readonly nameVariants: Map<NamingConvention, string>
    /**
     * Contains description of the model is optional but helps authors of the schema / client API to better explain the original purpose of the model to the consumers.
     */
    readonly description: string | undefined
    /**
     * Deprecation notice contains information about planned removal of this entity from the model / client API. This allows to plan and evolve the schema allowing clients to adapt early to planned breaking changes.  If notice is `null`, this schema is considered not deprecated.
     */
    readonly deprecationNotice: string | undefined

    /**
     * Reference to `Entity.type` of the referenced entity. Might be also any `String` that identifies type some external resource not maintained by Evita.
     */
    readonly entityType: string
    /**
     * Contains `true` if `entityType` refers to any existing entity that is maintained by Evita.
     */
    readonly referencedEntityTypeManaged: boolean
    readonly entityTypeNameVariants: Map<NamingConvention, string>

    /**
     * Reference to `Entity.type` of the referenced entity. Might be also `String` that identifies type some external resource not maintained by Evita.
     */
    readonly referencedGroupType: string | undefined
    /**
     * Contains `true` if `groupType` refers to any existing entity that is maintained by Evita.
     */
    readonly referencedGroupTypeManaged: boolean | undefined
    readonly groupTypeNameVariants: Map<NamingConvention, string> | undefined

    readonly cardinality: Cardinality

    /**
     * Attributes related to reference allows defining set of data that are fetched in bulk along with the entity body. Attributes may be indexed for fast filtering (`AttributeSchema.filterable`) or can be used to sort along (`AttributeSchema.filterable`). Attributes are not automatically indexed in order not to waste precious memory space for data that will never be used in search queries.  Filtering in attributes is executed by using constraints like `and`, `not`, `attribute_{name}_equals`, `attribute_{name}_contains` and many others. Sorting can be achieved with `attribute_{name}_natural` or others.  Attributes are not recommended for bigger data as they are all loaded at once.
     */
    readonly attributes: Map<string, AttributeSchema>
    /**
     * Contains definitions of all sortable attribute compounds defined in this schema.
     */
    readonly sortableAttributeCompounds: Map<string, SortableAttributeCompoundSchema>
    readonly scopedIndexTypes: List<ScopedReferenceIndexType>
    readonly facetedInScopes: List<EntityScope>
    /**
     * Per-scope expressions narrowing which entities participate in faceting.
     */
    readonly facetedPartiallyInScopes: List<ScopedExpression>
    /**
     * Per-scope bucketed histogram index definitions.
     */
    readonly histogramIndexDefinitions: List<ScopedHistogramIndexDefinition>
    /**
     * Per-scope expressions narrowing which entities participate in bucketed histogram computation.
     */
    readonly bucketedPartiallyInScopes: List<ScopedExpression>

    private _representativeFlags?: List<Flag>

    constructor(name: string,
                nameVariants: Map<NamingConvention, string>,
                description: string | undefined,
                deprecationNotice: string | undefined,
                entityType: string,
                referencedEntityTypeManaged: boolean,
                entityTypeNameVariants: Map<NamingConvention, string>,
                referencedGroupType: string | undefined,
                referencedGroupTypeManaged: boolean | undefined,
                groupTypeNameVariants: Map<NamingConvention, string> | undefined,
                cardinality: Cardinality,
                attributes: AttributeSchema[],
                sortableAttributeCompounds: SortableAttributeCompoundSchema[],
                scopedIndexTypes: List<ScopedReferenceIndexType>,
                facetedInScopes: List<EntityScope>,
                facetedPartiallyInScopes: List<ScopedExpression>,
                histogramIndexDefinitions: List<ScopedHistogramIndexDefinition>,
                bucketedPartiallyInScopes: List<ScopedExpression>) {
        super()
        this.name = name
        this.nameVariants = nameVariants
        this.description = description
        this.deprecationNotice = deprecationNotice
        this.entityType = entityType
        this.referencedEntityTypeManaged = referencedEntityTypeManaged
        this.entityTypeNameVariants = entityTypeNameVariants
        this.referencedGroupType = referencedGroupType
        this.referencedGroupTypeManaged = referencedGroupTypeManaged
        this.groupTypeNameVariants = groupTypeNameVariants
        this.cardinality = cardinality
        this.attributes = Map(attributes.map(attribute => [attribute.name, attribute]))
        this.sortableAttributeCompounds = Map(sortableAttributeCompounds.map(sac => [sac.name, sac]))
        this.scopedIndexTypes = scopedIndexTypes
        this.facetedInScopes = facetedInScopes
        this.facetedPartiallyInScopes = facetedPartiallyInScopes
        this.histogramIndexDefinitions = histogramIndexDefinitions
        this.bucketedPartiallyInScopes = bucketedPartiallyInScopes
    }

    /**
     * TRUE when the reference is indexed in the given scope (any index type other than `None`).
     */
    isIndexedInScope(scope: EntityScope): boolean {
        return this.scopedIndexTypes.some(x =>
            x.scope === scope && x.indexType !== ReferenceIndexType.None
        )
    }

    /**
     * TRUE when facet statistics are maintained for the reference in the given scope.
     */
    isFacetedInScope(scope: EntityScope): boolean {
        return this.facetedInScopes.includes(scope)
    }

    /**
     * Expression narrowing which entities participate in faceting for the given scope, or `undefined`
     * if all faceted entities participate.
     */
    getFacetedPartiallyInScope(scope: EntityScope): string | undefined {
        return this.facetedPartiallyInScopes.find(x => x.scope === scope)?.expression
    }

    /**
     * TRUE when a bucketed histogram index is maintained for the reference in the given scope.
     */
    isBucketedInScope(scope: EntityScope): boolean {
        return this.histogramIndexDefinitions.some(x => x.scope === scope)
    }

    /**
     * Returns the named histogram definition in the given scope, or `undefined` if not found.
     */
    getHistogramIndexDefinition(scope: EntityScope, name: string): HistogramIndexDefinition | undefined {
        return this.histogramIndexDefinitions
            .find(x => x.scope === scope && x.definition.nameOfTheIndex === name)
            ?.definition
    }

    /**
     * Returns the histogram definition for the given scope and name translated through the given
     * NamingConvention, or `undefined` if no histogram with the given variant name exists in that scope.
     */
    getHistogramIndexDefinitionByName(
        scope: EntityScope,
        name: string,
        namingConvention: NamingConvention
    ): HistogramIndexDefinition | undefined {
        return this.histogramIndexDefinitions
            .find(x =>
                x.scope === scope &&
                x.definition.nameVariants.get(namingConvention) === name
            )
            ?.definition
    }

    /**
     * All histogram definitions for the given scope, keyed by histogram name. Empty map if the
     * reference is not bucketed in that scope.
     */
    getHistogramIndexDefinitions(scope: EntityScope): Map<string, HistogramIndexDefinition> {
        return Map(
            this.histogramIndexDefinitions
                .filter(x => x.scope === scope)
                .map(x => [x.definition.nameOfTheIndex, x.definition] as [string, HistogramIndexDefinition])
        )
    }

    /**
     * Map of all scopes to their named bucketed histogram definitions. Only scopes where the reference
     * is actually bucketed are included.
     */
    getAllHistogramIndexDefinitions(): Map<EntityScope, Map<string, HistogramIndexDefinition>> {
        const grouped = new globalThis.Map<EntityScope, [string, HistogramIndexDefinition][]>()
        for (const entry of this.histogramIndexDefinitions) {
            const bucket = grouped.get(entry.scope) ?? []
            bucket.push([entry.definition.nameOfTheIndex, entry.definition])
            grouped.set(entry.scope, bucket)
        }
        return Map(
            Array.from(grouped.entries()).map(([scope, pairs]) =>
                [scope, Map(pairs)] as [EntityScope, Map<string, HistogramIndexDefinition>]
            )
        )
    }

    /**
     * Expression narrowing which entities participate in bucketed histogram computation in the given
     * scope, or `undefined` if all bucketed entities participate.
     */
    getBucketedPartiallyInScope(scope: EntityScope): string | undefined {
        return this.bucketedPartiallyInScopes.find(x => x.scope === scope)?.expression
    }

    get representativeFlags(): List<Flag> {
        if (this._representativeFlags == null) {
            const { t } = useI18n()
            const representativeFlags: Flag[] = []

            if (!this.referencedEntityTypeManaged) representativeFlags.push(new Flag(ReferenceSchemaFlag.External))

            const indexedScopes = this.scopedIndexTypes
                .filter(x => x.indexType !== ReferenceIndexType.None)
                .map(x => x.scope)
                .toArray()
            if (indexedScopes.length > 0) {
                representativeFlags.push(new Flag(
                    ReferenceSchemaFlag.Indexed,
                    indexedScopes,
                    t('schemaViewer.reference.tooltip.content', [
                        '',
                        indexedScopes
                            .map(s => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, s).toLowerCase()}`))
                            .join('/')
                    ])
                ))
            }

            if (this.facetedInScopes.size > 0) representativeFlags.push(new Flag(ReferenceSchemaFlag.Faceted, this.facetedInScopes.map(x => x).toArray(), t('schemaViewer.reference.tooltip.facetedContent', ['', this.facetedInScopes.map(z => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, z).toLowerCase()}`)).join('/')])))

            const bucketedScopes = this.histogramIndexDefinitions
                .map(x => x.scope)
                .toSet()
                .toArray()
            if (bucketedScopes.length > 0) {
                representativeFlags.push(new Flag(
                    ReferenceSchemaFlag.Bucketed,
                    bucketedScopes,
                    t('schemaViewer.reference.tooltip.content', [
                        '',
                        bucketedScopes
                            .map(s => t(`schemaViewer.tooltip.${getEnumKeyByValue(EntityScope, s).toLowerCase()}`))
                            .join('/')
                    ])
                ))
            }

            this._representativeFlags = List(representativeFlags)
        }
        return this._representativeFlags
    }
}

/**
 * Supported representative flags for reference schema
 */
export enum ReferenceSchemaFlag {
    External = '_referenceSchema.external',
    Indexed = '_referenceSchema.indexed',
    Faceted = '_referenceSchema.faceted',
    Bucketed = '_referenceSchema.bucketed'
}
