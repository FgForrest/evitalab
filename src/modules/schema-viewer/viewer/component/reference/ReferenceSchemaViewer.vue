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
import { List } from 'immutable'
import { computed, ref } from 'vue'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { SchemaViewerService, useSchemaViewerService } from '@/modules/schema-viewer/viewer/service/SchemaViewerService'

const workspaceService: WorkspaceService = useWorkspaceService()
const schemaViewerService: SchemaViewerService = useSchemaViewerService()
const schemaViewerTabFactory: SchemaViewerTabFactory = useSchemaViewerTabFactory()
const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer,
    schema: ReferenceSchema
}>()

const loadedEntityNameVariants = ref<boolean>()
const entityNameVariants = ref<Immutable.Map<NamingConvention, string>>()

const loadedReferencedGroupType = ref<boolean>()
const groupTypeNameVariants = ref<Immutable.Map<NamingConvention, string> | undefined>()

const properties = computed<Property[]>(() => {
    const properties: Property[] = []

    properties.push(new Property(
        t('schemaViewer.reference.label.description'),
        new PropertyValue(props.schema.description)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.deprecationNotice'),
        new PropertyValue(props.schema.deprecationNotice)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.cardinality'),
        new PropertyValue(new KeywordValue(props.schema.cardinality))
    ))
    if (props.schema.referencedEntityTypeManaged) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedEntity'),
            new PropertyValue(
                new KeywordValue(props.schema.entityType),
                undefined,
                item => {
                    workspaceService.createTab(schemaViewerTabFactory.createNew(
                        new EntitySchemaPointer(
                            props.dataPointer.schemaPointer.catalogName,
                            props.schema.entityType
                        )
                    ))
                }
            )
        ))
    } else {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedEntity'),
            new PropertyValue(new KeywordValue(props.schema.entityType))
        ))
    }
    properties.push(new Property(
        t('schemaViewer.reference.label.referencedEntityManaged'),
        new PropertyValue(props.schema.referencedEntityTypeManaged)
    ))
    if (props.schema.referencedGroupType == undefined) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(undefined)
        ))
    } else if (props.schema.referencedGroupTypeManaged) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(
                props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType) : undefined,
                undefined,
                item => {
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
            new PropertyValue(props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType) : undefined)
        ))
    }
    properties.push(new Property(
        t('schemaViewer.reference.label.referencedGroupManaged'),
        new PropertyValue(props.schema.referencedGroupTypeManaged || false)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.indexed'),
        new PropertyValue(props.schema.indexed)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.faceted'),
        new PropertyValue(props.schema.faceted)
    ))

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
</script>

<template>
    <SchemaContainer :properties="properties">
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
                :attributes="List(schema.attributes.values())"
            />
        </template>
    </SchemaContainer>
</template>

<style lang="scss" scoped>

</style>
