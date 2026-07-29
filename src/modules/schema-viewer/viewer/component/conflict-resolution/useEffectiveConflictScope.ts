import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { Property } from '@/modules/base/model/properties-table/Property.ts'
import { useToaster, type Toaster } from '@/modules/notification/service/Toaster.ts'
import { i18n } from '@/vue-plugins/i18n.ts'
import { asError } from '@/utils/error.ts'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer.ts'
import {
    CatalogAttributeSchemaPointer
} from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer.ts'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer.ts'
import {
    useSchemaViewerService,
    type SchemaViewerService
} from '@/modules/schema-viewer/viewer/service/SchemaViewerService.ts'
import {
    ConflictItemKind,
    resolveCatalogPolicy,
    resolveEntityPolicy,
    resolveItemScope,
    type ResolvedPolicy
} from '@/modules/schema-viewer/viewer/service/ConflictResolutionResolver.ts'
import {
    ConflictResolutionOverride
} from '@/modules/database-driver/request-response/schema/ConflictResolutionOverride.ts'
import {
    buildConflictOverrideProperty,
    buildEffectiveConflictScopeProperty,
    ConflictPolicyLevel
} from '@/modules/schema-viewer/viewer/component/conflict-resolution/conflictResolutionProperties.ts'

/**
 * Resolves the conflict-resolution rows of an item tab (attribute, associated data, reference).
 *
 * The rows need the owning entity's effective policy, which lives on other schemas than the inspected
 * item, so they are resolved asynchronously and appended to the tab only once available. A catalog-level
 * global attribute has no owning entity and resolves against the catalog's own effective policy instead.
 *
 * @param dataPointer pointer of the inspected item tab
 * @param itemKind kind the item resolves as - a reference's attribute must resolve as
 *        {@link ConflictItemKind.ReferenceAttribute}, not as an entity attribute
 * @param override accessor of the override declared on the inspected item
 */
export function useEffectiveConflictScope(
    dataPointer: SchemaViewerDataPointer,
    itemKind: ConflictItemKind,
    override: () => ConflictResolutionOverride
): ComputedRef<Property[]> {
    const toaster: Toaster = useToaster()
    const schemaViewerService: SchemaViewerService = useSchemaViewerService()

    const ownerLevel: ConflictPolicyLevel =
        dataPointer.schemaPointer instanceof CatalogAttributeSchemaPointer
            ? ConflictPolicyLevel.Catalog
            : ConflictPolicyLevel.Entity
    const ownerPolicy: Ref<ResolvedPolicy | undefined> = ref<ResolvedPolicy>()

    resolveOwnerPolicy()
        .then(policy => ownerPolicy.value = policy)
        .catch(e => toaster.error(
            i18n.global.t('schemaViewer.conflictResolution.notification.failedToResolvePolicy'),
            asError(e)
        ))

    async function resolveOwnerPolicy(): Promise<ResolvedPolicy> {
        const catalogName: string = dataPointer.schemaPointer.catalogName
        const catalogSchema = await schemaViewerService.getCatalogSchema(catalogName)
        if (ownerLevel === ConflictPolicyLevel.Catalog) {
            return resolveCatalogPolicy(catalogSchema)
        }
        const entitySchema = await schemaViewerService.getEntitySchema(
            catalogName,
            (dataPointer.schemaPointer as EntitySchemaPointer).entityType
        )
        return resolveEntityPolicy(entitySchema, catalogSchema)
    }

    return computed<Property[]>(() => {
        const policy: ResolvedPolicy | undefined = ownerPolicy.value
        if (policy == undefined) {
            return []
        }

        const declaredOverride: ConflictResolutionOverride = override()
        const itemScope = resolveItemScope(itemKind, declaredOverride, policy)

        const properties: Property[] = []
        const overrideProperty: Property | undefined = buildConflictOverrideProperty(
            declaredOverride,
            itemScope,
            policy,
            itemKind,
            ownerLevel
        )
        if (overrideProperty != undefined) {
            properties.push(overrideProperty)
        }
        properties.push(buildEffectiveConflictScopeProperty(
            itemScope,
            declaredOverride,
            itemKind,
            ownerLevel
        ))
        return properties
    })
}
