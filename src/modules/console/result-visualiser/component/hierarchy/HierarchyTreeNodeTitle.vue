<script setup lang="ts">
/**
 * Renders title of a single hierarchy tree node.
 */

import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    node: VisualisedHierarchyTreeNode
}>()

async function copyPrimaryKey(): Promise<void> {
    if (props.node.primaryKey != undefined) {
        try {
            await navigator.clipboard.writeText(`${props.node.primaryKey}`)
            await toaster.info(t('resultVisualizer.hierarchyVisualiser.notification.primaryKeyCopiedToClipboard'))
        } catch {
            await toaster.error(t('common.notification.failedToCopyToClipboard'))
        }
    } else {
        await toaster.error(t('resultVisualizer.hierarchyVisualiser.notification.noPrimaryKeyProperty'))
    }
}
async function copyParentPrimaryKey(): Promise<void> {
    if (props.node.parentPrimaryKey != undefined) {
        try {
            await navigator.clipboard.writeText(`${props.node.parentPrimaryKey}`)
            await toaster.info(t('resultVisualizer.hierarchyVisualiser.notification.parentPrimaryKeyCopiedToClipboard'))
        } catch {
            await toaster.error(t('common.notification.failedToCopyToClipboard'))
        }
    } else {
        await toaster.error(t('resultVisualizer.hierarchyVisualiser.notification.noParentPrimaryKeyProperty'))
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
            {{ node.title || t('resultVisualizer.hierarchyVisualiser.label.unknown') }}
            <VTooltip v-if="!node.title" activator="parent">
                <VMarkdown :source="t('resultVisualizer.hierarchyVisualiser.help.noRepresentativeProperty')" />
            </VTooltip>
        </span>

        <VLazy>
            <VChipGroup>
                <VChip v-if="node.requested" prepend-icon="mdi-target">
                    {{ t('resultVisualizer.hierarchyVisualiser.label.requested') }}
                    <VTooltip activator="parent">
                        <VMarkdown :source="t('resultVisualizer.hierarchyVisualiser.help.requestedEntity')" />
                    </VTooltip>
                </VChip>

                <VChip prepend-icon="mdi-file-tree">
                    {{ node.childrenCount ?? '-' }}
                    <VTooltip activator="parent">
                        <VMarkdown v-if="node.childrenCount == undefined" :source="t('resultVisualizer.hierarchyVisualiser.help.noChildrenCountProperty')" />
                        <span v-else>
                            {{ t('resultVisualizer.hierarchyVisualiser.help.childrenCountProperty') }}
                        </span>
                    </VTooltip>
                </VChip>

                <VChip prepend-icon="mdi-format-list-bulleted">
                    {{ node.queriedEntityCount ?? '-' }}
                    <VTooltip activator="parent">
                        <VMarkdown v-if="node.queriedEntityCount == undefined" :source="t('resultVisualizer.hierarchyVisualiser.help.noQueriedEntityCountProperty')" />
                        <span v-else>{{ t('resultVisualizer.hierarchyVisualiser.help.queriedEntityCountProperty') }}</span>
                    </VTooltip>
                </VChip>
            </VChipGroup>
        </VLazy>
    </VListItemTitle>
</template>

<style lang="scss" scoped>
@use "@/styles/colors.scss" as *;
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
