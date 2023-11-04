<script setup lang="ts">
/**
 * Visualises raw JSON statistics of a single hierarchy.
 */

import { computed, ref } from 'vue'
import { Toaster, useToaster } from '@/services/editor/toaster'
import LabEditorResultVisualiserHierarchyTreeNode
    from '@/components/lab/editor/result-visualiser/hierarchy/LabEditorResultVisualiserHierarchyTreeNode.vue'
import { Result, VisualisedNamedHierarchy } from '@/model/editor/result-visualiser'
import { ResultVisualiserService } from '@/services/editor/result-visualiser/result-visualiser.service'
import VMarkdown from '@/components/base/VMarkdown.vue'
import VListItemLazyIterator from '@/components/base/VListItemLazyIterator.vue'

const namedHierarchyTreesPageSize: number = 10

const toaster: Toaster = useToaster()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    name: string
    namedHierarchyResult: Result[],
    entityRepresentativeAttributes: string[]
}>()

const namedHierarchy = computed<VisualisedNamedHierarchy | undefined>(() => {
    try {
        return props.visualiserService
            .getHierarchyService()
            .resolveNamedHierarchy(props.namedHierarchyResult, props.entityRepresentativeAttributes)
    } catch (e: any) {
        toaster.error(e)
        return undefined
    }
})
const namedHierarchyTreesPage = ref<number>(1)

const initialized = ref<boolean>(false)
function initialize(): void {
    // todo lho this makes quick hide of the facet group, it looks weird
    initialized.value = !initialized.value
}

</script>

<template>
    <VListGroup>
        <template #activator="{ props }">
            <VListItem v-bind="props" @click="initialize">
                <template #prepend>
                    <VIcon>mdi-file-tree</VIcon>
                </template>
                <template #title>
                    <VListItemTitle class="named-hierarchy-title">
                        <span>{{ name }}</span>

                        <VLazy>
                            <VChipGroup>
                                <VChip prepend-icon="mdi-file-tree">
                                    <span>
                                        {{ namedHierarchy?.count }}
                                        <VTooltip activator="parent">
                                            <!-- todo jno is this what we want to display? At this point we don't have total number of children. -->
                                            <span>The number of actually fetched nodes.</span>
                                        </VTooltip>
                                    </span>
                                </VChip>

                                <VChip v-if="namedHierarchy?.requestedNode" prepend-icon="mdi-target">
                                    {{ namedHierarchy?.requestedNode?.primaryKey != undefined ? `${namedHierarchy?.requestedNode?.primaryKey}: ` : '' }}
                                    {{ namedHierarchy?.requestedNode?.title }}
                                    <VTooltip activator="parent">
                                        <!-- todo jno review explanation -->
                                        <VMarkdown source="An entity representing a hierarchy node in this tree that was filtered by `hierarchyWithin`." />
                                    </VTooltip>
                                </VChip>
                            </VChipGroup>
                        </VLazy>
                    </VListItemTitle>
                </template>
            </VListItem>
        </template>

        <template v-if="initialized && namedHierarchy">
            <VListItemLazyIterator
                :items="namedHierarchy.trees"
                v-model:page="namedHierarchyTreesPage"
                :page-size="namedHierarchyTreesPageSize"
            >
                <template #item="{ item: tree }">
                    <LabEditorResultVisualiserHierarchyTreeNode
                        :node="tree"
                        :entity-representative-attributes="entityRepresentativeAttributes"
                    />
                </template>
            </VListItemLazyIterator>
        </template>
    </VListGroup>
</template>

<style lang="scss" scoped>
// todo lho better handling for small widths
.named-hierarchy-title {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>
