<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useWorkspaceService, WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
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
import { ConnectionService, useConnectionService } from '@/modules/connection/service/ConnectionService'
import { computed, ref } from 'vue'
import { Immutable } from '@babel/types'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'

const workspaceService: WorkspaceService = useWorkspaceService()
const connectionService: ConnectionService = useConnectionService()
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
        new PropertyValue(props.schema.description.getIfSupported()!)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.deprecationNotice'),
        new PropertyValue(props.schema.deprecationNotice.getIfSupported()!)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.cardinality'),
        new PropertyValue(new KeywordValue(props.schema.cardinality.getIfSupported()!))
    ))
    if (props.schema.referencedEntityTypeManaged.getOrElse(false)) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedEntity'),
            new PropertyValue(
                new KeywordValue(props.schema.entityType.getIfSupported()!),
                undefined,
                item => {
                    workspaceService.createTab(schemaViewerTabFactory.createNew(
                        props.dataPointer.connection,
                        new EntitySchemaPointer(
                            props.dataPointer.schemaPointer.catalogName,
                            props.schema.entityType.getIfSupported()!
                        )
                    ))
                }
            )
        ))
    } else {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedEntity'),
            new PropertyValue(new KeywordValue(props.schema.entityType.getIfSupported()!))
        ))
    }
    properties.push(new Property(
        t('schemaViewer.reference.label.referencedEntityManaged'),
        new PropertyValue(props.schema.referencedEntityTypeManaged.getOrElse(false))
    ))
    if (props.schema.referencedGroupType.getIfSupported() == undefined) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(undefined)
        ))
    } else if (props.schema.referencedGroupTypeManaged.getOrElse(false)) {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(
                props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType.getIfSupported()!) : undefined,
                undefined,
                item => {
                    workspaceService.createTab(schemaViewerTabFactory.createNew(
                        props.dataPointer.connection,
                        new EntitySchemaPointer(
                            props.dataPointer.schemaPointer.catalogName,
                            props.schema.referencedGroupType.getIfSupported()! as string
                        )
                    ))
                }
            )
        ))
    } else {
        properties.push(new Property(
            t('schemaViewer.reference.label.referencedGroup'),
            new PropertyValue(props.schema.referencedGroupType ? new KeywordValue(props.schema.referencedGroupType.getIfSupported()!) : undefined)
        ))
    }
    properties.push(new Property(
        t('schemaViewer.reference.label.referencedGroupManaged'),
        new PropertyValue(props.schema.referencedGroupTypeManaged.getOrElse(false) || false)
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.indexed'),
        new PropertyValue(props.schema.indexed.getIfSupported())
    ))
    properties.push(new Property(
        t('schemaViewer.reference.label.faceted'),
        new PropertyValue(props.schema.faceted.getIfSupported())
    ))

    return properties
})

!props.schema.referencedEntityTypeManaged.getOrThrow() ?
    localEntityTypeNameVariants() :
    getEntityTypeNameVariants().then(() => loadedEntityNameVariants.value = true)

!props.schema.referencedGroupTypeManaged.getOrThrow() ?
    localReferenceGroupType() :
    getGroupTypeNameVariants().then(() => loadedReferencedGroupType.value = true)

function localReferenceGroupType() {
    groupTypeNameVariants.value = props.schema.groupTypeNameVariants.getOrThrow()
    loadedReferencedGroupType.value = true
}

function localEntityTypeNameVariants() {
    entityNameVariants.value = props.schema.entityTypeNameVariants.getOrThrow()
    loadedEntityNameVariants.value = true
}

async function getEntityTypeNameVariants() {
    const entitySchema = await connectionService.getEntitySchema(props.dataPointer.connection, props.dataPointer.schemaPointer.catalogName, props.schema.entityType.getOrThrow())
    entityNameVariants.value = entitySchema.nameVariants.getOrThrow()
}

async function getGroupTypeNameVariants() {
    const groupType = await connectionService.getEntitySchema(props.dataPointer.connection, props.dataPointer.schemaPointer.catalogName, props.schema.referencedGroupType.getOrThrow()!)
    groupTypeNameVariants.value = groupType.nameVariants.getOrThrow()
}

function isGroupType(): boolean {
    return (props.schema.referencedGroupType.isSupported() && props.schema.referencedGroupType.getIfSupported() != undefined)
}
</script>

<template>
    <SchemaContainer :properties="properties">
        <template #nested-details>
            <NameVariants :name-variants="schema.nameVariants.getIfSupported()!" />

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
                v-if="schema.attributes.isSupported() && schema.attributes.getIfSupported()!.size > 0"
                :data-pointer="dataPointer"
                :attributes="List(schema.attributes.getIfSupported()!.values())"
            />
        </template>
    </SchemaContainer>
</template>

<style lang="scss" scoped>

</style>
