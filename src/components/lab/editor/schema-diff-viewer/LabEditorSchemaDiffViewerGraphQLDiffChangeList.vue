<script setup lang="ts">
/**
 * Listing of changes in a GraphQL schema diff.
 */

import VListItemDivider from '@/components/base/VListItemDivider.vue'
import LabEditorSchemaDiffViewerGraphQLDiffChangeIcon
    from '@/components/lab/editor/schema-diff-viewer/LabEditorSchemaDiffViewerGraphQLDiffChangeIcon.vue'
import { GraphQLSchemaChange } from '@/model/evitadb'

const props = defineProps<{
    changes: GraphQLSchemaChange[]
}>()
</script>

<template>
    <VExpansionPanel v-if="changes.length > 0">
        <VExpansionPanelTitle>
            <slot name="title"/>
            <span>&nbsp;({{ changes.length }})</span>
        </VExpansionPanelTitle>
        <VExpansionPanelText>
            <VList>
                <template v-for="(change, index) in changes" :key="index">
                    <VListItem>
                        <template #prepend>
                            <LabEditorSchemaDiffViewerGraphQLDiffChangeIcon :change="change" />
                        </template>

                        <VListItemTitle>
                            {{ change.type.code }} - {{ change.args }}
                        </VListItemTitle>

                        <template #append>
                            <VBtn prepend-icon="mdi-check">
                                Checked

                                <VTooltip activator="parent">
                                    Mark locally as checked. This is only a visual helper for you to keep track of what you
                                    have already checked.
                                </VTooltip>
                            </VBtn>
                        </template>
                    </VListItem>

                    <VListItemDivider v-if="index < changes.length - 1"/>
                </template>
            </VList>
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>

</style>
