<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import { KeywordValue } from '@/modules/base/model/properties-table/KeywordValue'
import {
    SchemaViewerTabFactory,
    useSchemaViewerTabFactory
} from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import AttributeSchemaList from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaList.vue'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { computed, ref } from 'vue'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { SchemaViewerService, useSchemaViewerService } from '@/modules/schema-viewer/viewer/service/SchemaViewerService'
import { ReflectedReferenceSchema } from '@/modules/database-driver/request-response/schema/ReflectedReferenceSchema.ts'
import ReflectedReferenceList
    from '@/modules/schema-viewer/viewer/component/reference/reflected/ReflectedReferenceList.vue'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer.ts'
import RelationViewer from '@/modules/schema-viewer/viewer/component/reference/relation-viewer/RelationViewer.vue'
import { MultiValueFlagValue } from '@/modules/base/model/properties-table/MultiValueFlagValue.ts'
import { getEnumKeyByValue } from '@/utils/enum.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import HistogramIndexDefinitionList from '@/modules/schema-viewer/viewer/component/reference/HistogramIndexDefinitionList.vue'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()
const scopes = [EntityScope.Live, EntityScope.Archive] as const

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const loadedEntityNameVariants = ref<boolean>()
const referenceSchemaPointer = ref<ReferenceSchemaPointer>(props.dataPointer.schemaPointer as ReferenceSchemaPointer)
const entityNameVariants = ref<ImmutableMap<NamingConvention, string>>()

const loadedReferencedGroupType = ref<boolean>()
const groupTypeNameVariants = ref<ImmutableMap<NamingConvention, string> | undefined>()
const loadedReflectedReferences = ref<boolean>()
const reflectedReferences = ref<ImmutableList<ReflectedReferenceSchema>>()

const hasHistogramDefinitions = computed(() =>
    props.schema.isBucketedInScope(EntityScope.Live) ||
    props.schema.isBucketedInScope(EntityScope.Archive)
)

const properties = computed<Property[]>(() => {
    const properties: Property[] = []

    if (props.schema instanceof ReflectedReferenceSchema && props.schema.reflectedReferenceName) {
        const reflectedRefenceSchema = props.schema as ReflectedReferenceSchema
        properties.push(new Property(
            t('schemaViewer.reference.label.reflectedReference'),
            new PropertyValue(new KeywordValue(t(props.schema.reflectedReferenceName)), undefined, () => {
                workspaceService.createTab(schemaViewerTabFactory.createNew(
                    new ReferenceSchemaPointer(
                        props.dataPointer.schemaPointer.catalogName,
                        props.schema.entityType,
                        reflectedRefenceSchema.reflectedReferenceName!
                    )
                ))
            })
        ))
    }
    properties.push(new Property(
        t('schemaViewer.reference.label.description'),
        new PropertyValue(props.schema.description)
    ))
    if (props.schema.deprecationNotice) {
        properties.push(new Property(
            t('schemaViewer.reference.label.deprecationNotice'),
            new PropertyValue(props.schema.deprecationNotice)
        ))
    }
    if (props.schema.referencedGroupType == undefined) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(undefined)
        ))
    } else if (props.schema.referencedGroupTypeManaged) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(
                props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType, undefined, t('schemaViewer.reference.label.groupManagedByEvita')) : undefined,
                undefined,
                _item => {
                    workspaceService.createTab(schemaViewerTabFactory.createNew(
                        new EntitySchemaPointer(
                            props.dataPointer.schemaPointer.catalogName,
                            props.schema.referencedGroupType as string
                        )
                    ))
                }
            )
        ))
    } else {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(new KeywordValue(props.schema.referencedGroupType, t('schemaViewer.reference.label.groupManagedExternal')) ? new KeywordValue(props.schema.referencedGroupType, undefined, t('schemaViewer.reference.label.groupManagedExternal')) : undefined)
        ))
    }

    properties.push(new Property(t('schemaViewer.reference.label.indexed.title'), ImmutableList(scopes.map(s => new PropertyValue(new MultiValueFlagValue(
        props.schema.isIndexedInScope(s),
        t(`schemaViewer.reference.label.${getEnumKeyByValue(EntityScope, s).toLowerCase()}`) + (() => {
            const list = props.schema.scopedIndexTypes
                .filter(q => q.scope === s && q.indexType !== ReferenceIndexType.None)
                .map(z => t(`schemaViewer.reference.label.indexed.${z.indexType}`))
                .join(' ')
            return list ? ` (${list})` : ''
        })(),
        props.schema.scopedIndexTypes
            .filter(q => q.scope === s && q.indexType !== ReferenceIndexType.None)
            .map(z => t(`schemaViewer.reference.tooltip.indexedTooltip.${z.indexType}`))
            .join(' ')
    ))))))
    properties.push(
        new Property(
            t('schemaViewer.reference.label.faceted'),
            ImmutableList(
                scopes.map(s => {
                    const faceted = props.schema.isFacetedInScope(s)
                    const partialExpression = props.schema.getFacetedPartiallyInScope(s)
                    const isPartial = faceted && partialExpression != null && partialExpression.trim() !== ''
                    const scopeLabel = t(`schemaViewer.reference.label.${getEnumKeyByValue(EntityScope, s).toLowerCase()}`)
                    return new PropertyValue(
                        new MultiValueFlagValue(
                            faceted,
                            isPartial ? `${scopeLabel} (${t('schemaViewer.reference.label.partial')})` : scopeLabel,
                            isPartial ? undefined : t('schemaViewer.reference.tooltip.faceted'),
                            faceted ? 'mdi-check' : 'mdi-close',
                            isPartial ? `${t('schemaViewer.reference.tooltip.faceted')}\n\n${t('schemaViewer.reference.tooltip.facetPartialExpression')}\n\n\`${partialExpression}\`` : undefined
                        )
                    )
                })
            )
        )
    )

    properties.push(
        new Property(
            t('schemaViewer.reference.label.bucketed'),
            ImmutableList(
                scopes.map(s => {
                    const bucketed = props.schema.isBucketedInScope(s)
                    const partialExpression = props.schema.getBucketedPartiallyInScope(s)
                    const isPartial = bucketed && partialExpression != null && partialExpression.trim() !== ''
                    const scopeLabel = t(`schemaViewer.reference.label.${getEnumKeyByValue(EntityScope, s).toLowerCase()}`)
                    return new PropertyValue(
                        new MultiValueFlagValue(
                            bucketed,
                            isPartial ? `${scopeLabel} (${t('schemaViewer.reference.label.partial')})` : scopeLabel,
                            isPartial ? undefined : t('schemaViewer.reference.tooltip.bucketed'),
                            bucketed ? 'mdi-check' : 'mdi-close',
                            isPartial ? `${t('schemaViewer.reference.tooltip.bucketed')}\n\n${t('schemaViewer.reference.tooltip.bucketedPartialExpression')}\n\n\`${partialExpression}\`` : undefined
                        )
                    )
                })
            )
        )
    )

    return properties
})

!props.schema.referencedEntityTypeManaged ?
    localEntityTypeNameVariants() :
    getEntityTypeNameVariants().then(() => loadedEntityNameVariants.value = true)

!props.schema.referencedGroupTypeManaged ?
    localReferenceGroupType() :
    getGroupTypeNameVariants().then(() => loadedReferencedGroupType.value = true)

function localReferenceGroupType() {
    groupTypeNameVariants.value = props.schema.groupTypeNameVariants
    loadedReferencedGroupType.value = true
}

function localEntityTypeNameVariants() {
    entityNameVariants.value = props.schema.entityTypeNameVariants
    loadedEntityNameVariants.value = true
}

async function getEntityTypeNameVariants() {
    const entitySchema = await schemaViewerService.getEntitySchema(
        props.dataPointer.schemaPointer.catalogName,
        props.schema.entityType
    )
    entityNameVariants.value = entitySchema.nameVariants
}

async function getGroupTypeNameVariants() {
    const groupType = await schemaViewerService.getEntitySchema(
        props.dataPointer.schemaPointer.catalogName,
        props.schema.referencedGroupType!
    )
    groupTypeNameVariants.value = groupType.nameVariants
}

function isGroupType(): boolean {
    return props.schema.referencedGroupType != undefined
}

async function loadAllReflectedSchemas(): Promise<void> {
    reflectedReferences.value = ImmutableList(await schemaViewerService.getReflectedSchema(props.dataPointer.schemaPointer.catalogName, props.schema.name))
    loadedReflectedReferences.value = true
}

onMounted(async () => {
    await loadAllReflectedSchemas()
})

</script>

<template>
    <div>
        <SchemaContainer :properties="properties">
            <template #prepend>
                <RelationViewer
                    :schema="schema"
                    :data-pointer="dataPointer"
                    :reference-schema-pointer="referenceSchemaPointer" />
            </template>
            <template #nested-details>
                <NameVariants :name-variants="schema.nameVariants" />

                <NameVariants
                    :prefix="t('schemaViewer.reference.label.referencedEntityNameVariants')"
                    v-if="loadedEntityNameVariants && entityNameVariants"
                    :name-variants="entityNameVariants"
                />

                <NameVariants
                    v-if="isGroupType() && loadedReferencedGroupType && groupTypeNameVariants"
                    :prefix="t('schemaViewer.reference.label.referencedGroupNameVariants')"
                    :name-variants="groupTypeNameVariants"
                />

                <AttributeSchemaList
                    v-if="schema.attributes && schema.attributes.size > 0"
                    :data-pointer="dataPointer"
                    :attributes="ImmutableList(schema.attributes.values())"
                />

                <HistogramIndexDefinitionList
                    v-if="hasHistogramDefinitions"
                    :schema="schema"
                />

                <ReflectedReferenceList
                    :loading="!loadedReflectedReferences"
                    v-if="!loadedReflectedReferences || (loadedReflectedReferences && reflectedReferences && reflectedReferences.size > 0)"
                    :data-pointer="props.dataPointer"
                    :schemas="reflectedReferences ?? ImmutableList([])"
                    :disabled="!loadedReflectedReferences"
                />
            </template>
        </SchemaContainer>
    </div>
</template>

<style lang="scss" scoped>
.lazy-loading {
    position: relative;
}
</style>
