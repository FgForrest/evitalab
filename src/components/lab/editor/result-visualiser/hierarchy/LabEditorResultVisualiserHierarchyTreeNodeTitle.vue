<script setup lang="ts">
/**
 * Renders title of a single hierarchy tree node.
 */

import VMarkdown from '@/components/base/VMarkdown.vue'
import { UnexpectedError } from '@/model/lab'
import { Toaster, useToaster } from '@/services/editor/toaster'
import { VisualisedHierarchyTreeNode } from '@/model/editor/result-visualiser'

const toaster: Toaster = useToaster()

const props = defineProps<{
    node: VisualisedHierarchyTreeNode
}>()

function copyPrimaryKey(): void {
    if (props.node.primaryKey != undefined) {
        navigator.clipboard.writeText(`${props.node.primaryKey}`).then(() => {
            toaster.info('Primary key copied to clipboard.')
        }).catch(() => {
            toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
        })
    } else {
        toaster.error('No primary key property was fetched.')
    }
}
function copyParentPrimaryKey(): void {
    if (props.node.parentPrimaryKey != undefined) {
        navigator.clipboard.writeText(`${props.node.parentPrimaryKey}`).then(() => {
            toaster.info('Parent primary key copied to clipboard.')
        }).catch(() => {
            toaster.error(new UnexpectedError(undefined, 'Failed to copy to clipboard.'))
        })
    } else {
        toaster.error('No parent primary key property was fetched.')
    }
}
</script>

<template>
    <VListItemTitle class="node-title">
        <span
            v-if="node.primaryKey != undefined"
            class="text-disabled d-flex align-center"
            style="cursor: pointer;"
            @click.stop="copyPrimaryKey"
        >
            <VIcon size="20" class="mr-1">mdi-key</VIcon>
            {{ node.primaryKey }}{{ node.parentPrimaryKey || node.title ? ':' : '' }}
        </span>
        <span
            v-if="node.parentPrimaryKey != undefined"
            class="text-disabled d-flex align-center"
            style="cursor: pointer;"
            @click.stop="copyParentPrimaryKey"
        >
            <VIcon size="20" class="mr-1">mdi-arrow-up-left</VIcon>
            {{ node.parentPrimaryKey }}{{ node.title ? ':' : '' }}
        </span>
        <span :class="{ 'node-title--requested': node.requested }">
            {{ node.title || 'Unknown' }}
            <VTooltip v-if="!node.title" activator="parent">
                <VMarkdown source="No `primaryKey` property or representative attributes were fetched." />
            </VTooltip>
        </span>

        <VChipGroup>
            <VChip v-if="node.requested" prepend-icon="mdi-target">
                Requested
                <VTooltip activator="parent">
                    <!-- todo jno review explanation -->
                    <VMarkdown source="The entity representing this hierarchy node was filtered by `hierarchyWithin`." />
                </VTooltip>
            </VChip>

            <VChip prepend-icon="mdi-file-tree">
                {{ node.childrenCount ?? '-' }}
                <VTooltip activator="parent">
                    <VMarkdown v-if="node.childrenCount == undefined" source="The `childrenCount` property was not found." />
                    <!-- todo jno review explanation, copied from docs, should be ok -->
                    <span v-else>
                        The count of child hierarchy nodes that exist in the hierarchy tree below the given node;
                        the count is correct regardless of whether the children themselves are requested/traversed
                        by the constraint definition, and respects hierarchyOfReference settings for automatic
                        removal of hierarchy nodes that would contain empty result set of queried entities
                        (REMOVE_EMPTY).
                    </span>
                </VTooltip>
            </VChip>

            <VChip prepend-icon="mdi-format-list-bulleted">
                {{ node.queriedEntityCount ?? '-' }}
                <VTooltip activator="parent">
                    <VMarkdown v-if="node.queriedEntityCount == undefined" source="The `queriedEntityCount` property was not found." />
                    <!-- todo jno review explanation, copied from docs, should be ok -->
                    <span v-else>
                        The total number of queried entities that will be returned if the current query is focused
                        on this particular hierarchy node using the hierarchyWithin filter constraint
                        (the possible refining constraint in the form of directRelation and excludingRoot is not
                        taken into account).
                    </span>
                </VTooltip>
            </VChip>
        </VChipGroup>
    </VListItemTitle>
</template>

<style lang="scss" scoped>
@import "@/styles/colors.scss";
// todo lho better handling for small widths
.node-title {
    display: flex;
    column-gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;

    &--requested {
        color: $primary-lightest!important;
    }
}
</style>
