<script setup lang="ts">
/**
 * Visualises raw JSON statistics of a single hierarchy.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import { ResultVisualiserService } from '@/modules/console/result-visualiser/service/ResultVisualiserService'
import { Result } from '@/modules/console/result-visualiser/model/Result'
import { VisualisedNamedHierarchy } from '@/modules/console/result-visualiser/model/hierarchy/VisualisedNamedHierarchy'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'
import VListItemLazyIterator from '@/modules/base/component/VListItemLazyIterator.vue'
import HierarchyTreeNode from '@/modules/console/result-visualiser/component/hierarchy/HierarchyTreeNode.vue'

const namedHierarchyTreesPageSize: number = 10

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    visualiserService: ResultVisualiserService,
    name: string
    namedHierarchyResult: Result,
    entityRepresentativeAttributes: string[]
}>()

const namedHierarchy = computed<VisualisedNamedHierarchy | undefined>(() => {
    try {
        return props.visualiserService
            .getHierarchyService()
            .resolveNamedHierarchy(props.namedHierarchyResult, props.entityRepresentativeAttributes)
    } catch (e: any) {
        toaster.error('Could not resolve hierarchy', e).then() // todo lho i18n
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
                                            <span>{{ t('resultVisualizer.hierarchyVisualiser.help.nodeCountProperty') }}</span>
                                        </VTooltip>
                                    </span>
                                </VChip>

                                <VChip v-if="namedHierarchy?.requestedNode" prepend-icon="mdi-target">
                                    {{ namedHierarchy?.requestedNode?.primaryKey != undefined ? `${namedHierarchy?.requestedNode?.primaryKey}: ` : '' }}
                                    {{ namedHierarchy?.requestedNode?.title }}
                                    <VTooltip activator="parent">
                                        <VMarkdown :source="t('resultVisualizer.hierarchyVisualiser.help.requestedNode')" />
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
                    <HierarchyTreeNode
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
