<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope'
import { HistogramIndexDefinition } from '@/modules/database-driver/request-response/schema/HistogramIndexDefinition'
import SchemaContainerSection from '@/modules/schema-viewer/viewer/component/SchemaContainerSection.vue'
import { Map } from 'immutable'

const { t } = useI18n()

const props = defineProps<{
    schema: ReferenceSchema
}>()

const liveDefinitions = computed<Map<string, HistogramIndexDefinition>>(() =>
    props.schema.getHistogramIndexDefinitions(EntityScope.Live)
)

const archiveDefinitions = computed<Map<string, HistogramIndexDefinition>>(() =>
    props.schema.getHistogramIndexDefinitions(EntityScope.Archive)
)
</script>

<template>
    <SchemaContainerSection :name="t('schemaViewer.reference.histogramDefinitions.title')">
        <template v-if="liveDefinitions.size > 0">
            <div class="text-subtitle-2 mt-2 mb-1">
                {{ t('schemaViewer.reference.histogramDefinitions.liveScope') }}
            </div>
            <VList density="compact">
                <VListItem
                    v-for="[name, definition] in liveDefinitions"
                    :key="name"
                >
                    <div class="item-body" >
                        <VListItemTitle>
                            <span class="mr-5">
                                {{ definition.nameOfTheIndex }}
                            </span>
                        </VListItemTitle>
                        <VChipGroup>
                            <VChip>
                                {{ definition.valueExpression }}
                                <VTooltip activator="parent">
                                    {{ t('schemaViewer.reference.histogramDefinitions.valueExpressionTooltip') }}
                                </VTooltip>
                            </VChip>
                        </VChipGroup>
                    </div>
                </VListItem>
            </VList>
        </template>

        <template v-if="archiveDefinitions.size > 0">
            <div class="text-subtitle-2 mt-2 mb-1">
                {{ t('schemaViewer.reference.histogramDefinitions.archiveScope') }}
            </div>
            <VList density="compact">
                <VListItem
                    v-for="[name, definition] in archiveDefinitions"
                    :key="name"
                >
                    <div class="item-body" >
                        <VListItemTitle>
                            <span class="mr-5">
                                {{ definition.nameOfTheIndex }}
                            </span>
                        </VListItemTitle>
                        <VChipGroup>
                            <VChip>
                                {{ definition.valueExpression }}
                                <VTooltip activator="parent">
                                    {{ t('schemaViewer.reference.histogramDefinitions.valueExpressionTooltip') }}
                                </VTooltip>
                            </VChip>
                        </VChipGroup>
                    </div>
                </VListItem>
            </VList>
        </template>
    </SchemaContainerSection>
</template>

<style lang="scss" scoped>
.item-body {
    display: flex;
    align-items: center;
}
</style>
