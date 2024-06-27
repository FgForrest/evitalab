<script setup lang="ts">
/**
 * Renders the differences between two GraphQL schemas.
 */

import { GraphQLSchemaDiff } from '@/model/evitadb'
import LabEditorSchemaDiffViewerGraphQLDiffChangePrefix
    from '@/components/lab/editor/schema-diff-viewer/LabEditorSchemaDiffViewerGraphQLDiffChangePrefix.vue'
import VListItemDivider from '@/components/base/VListItemDivider.vue'
import LabEditorSchemaDiffViewerGraphQLDiffChangeList
    from '@/components/lab/editor/schema-diff-viewer/LabEditorSchemaDiffViewerGraphQLDiffChangeList.vue'

const props = defineProps<{
    diff: GraphQLSchemaDiff
}>()

// todo uuids for each change?

// todo file upload
// todo check if both connections support required schema type
// todo listing paging
// todo i18n
// todo todo list checking

</script>

<template>
    <div class="graphql-diff">
        <VExpansionPanels variant="accordion">
            <LabEditorSchemaDiffViewerGraphQLDiffChangeList :changes="diff.breakingChanges">
                <template #title>
                    <VIcon color="error" class="mr-4">mdi-alert-outline</VIcon>
                    Breaking changes
                </template>
            </LabEditorSchemaDiffViewerGraphQLDiffChangeList>

            <LabEditorSchemaDiffViewerGraphQLDiffChangeList :changes="diff.nonBreakingChanges">
                <template #title>
                    Non-breaking changes
                </template>
            </LabEditorSchemaDiffViewerGraphQLDiffChangeList>

            <LabEditorSchemaDiffViewerGraphQLDiffChangeList :changes="diff.unclassifiedChanges">
                <template #title>
                    <VIcon color="warning" class="mr-4">mdi-help-circle-outline</VIcon>

                    <span>
                        Unclassified changes

                        <VTooltip activator="parent">
                            Unclassified change. This change couldn't be classified as breaking or non-breaking, probably an unsupported change.
                        </VTooltip>
                    </span>
                </template>
            </LabEditorSchemaDiffViewerGraphQLDiffChangeList>
        </VExpansionPanels>
    </div>
</template>

<style lang="scss" scoped>

</style>
