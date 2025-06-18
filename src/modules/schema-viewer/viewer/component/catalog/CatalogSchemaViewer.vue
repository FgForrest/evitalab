<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import {
    SchemaViewerService,
    useSchemaViewerService,
} from '../../service/SchemaViewerService'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { Property } from '@/modules/base/model/properties-table/Property'
import { PropertyValue } from '@/modules/base/model/properties-table/PropertyValue'
import SchemaContainer from '@/modules/schema-viewer/viewer/component/SchemaContainer.vue'
import NameVariants from '@/modules/schema-viewer/viewer/component/NameVariants.vue'
import AttributeSchemaList from '@/modules/schema-viewer/viewer/component/attribute/AttributeSchemaList.vue'
import EntitySchemaList from '@/modules/schema-viewer/viewer/component/entity/EntitySchemaList.vue'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'

const { t } = useI18n()

const props = defineProps<{
    dataPointer: SchemaViewerDataPointer
    schema: CatalogSchema
}>()

const catalogId = ref<string>()
const loaded = ref<boolean>(false)
const loadedSchemas = ref<boolean>(false)
const entitySchemas = ref<ImmutableMap<string, EntitySchema>>(ImmutableMap())

const toaster: Toaster = useToaster()
const schemaViewerService: SchemaViewerService = useSchemaViewerService()

schemaViewerService
    .getCatalog(props.schema.name)
    .then((x) => {
        catalogId.value = x.catalogId
        loaded.value = true
    })
    .catch((e) => toaster.error('Could not load catalog', e)) // todo lho i18n

props.schema
    .entitySchemas()
    .then((x) => {
        entitySchemas.value = x
        loadedSchemas.value = true
    })
    .catch()

const properties = computed<Property[]>(() => [
    new Property(
        t('schemaViewer.catalog.label.catalogId'),
        new PropertyValue(catalogId.value),
    ),
    new Property(
        t('schemaViewer.catalog.label.version'),
        new PropertyValue(props.schema.version),
    ),
    new Property(
        t('schemaViewer.catalog.label.description'),
        new PropertyValue(props.schema.description || ''),
    ),
])
</script>

<template>
    <div v-if="loaded">
        <SchemaContainer :properties="properties">
            <template #nested-details>
                <NameVariants
                    :name-variants="schema.nameVariants"
                />

                <AttributeSchemaList
                    v-if="schema.attributes && schema.attributes.size > 0"
                    :data-pointer="dataPointer"
                    :attributes="ImmutableList(schema.attributes.values())"
                />

                <EntitySchemaList
                    v-if="loadedSchemas && entitySchemas.size > 0"
                    :data-pointer="dataPointer"
                    :entities="ImmutableList(entitySchemas.values())"
                />
            </template>
        </SchemaContainer>
    </div>
</template>

<style lang="scss" scoped></style>
