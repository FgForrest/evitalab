<script setup lang="ts">
/**
 * Renders title of a single hierarchy tree node.
 */

import { useI18n } from 'vue-i18n'
import { Toaster, useToaster } from '@/modules/notification/service/Toaster'
import {
    VisualisedHierarchyTreeNode
} from '@/modules/console/result-visualiser/model/hierarchy/VisualisedHierarchyTreeNode'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import VMarkdown from '@/modules/base/component/VMarkdown.vue'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    node: VisualisedHierarchyTreeNode
}>()

function copyPrimaryKey(): void {
    if (props.node.primaryKey != undefined) {
        navigator.clipboard.writeText(`${props.node.primaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.hierarchyVisualiser.notification.primaryKeyCopiedToClipboard'))
        }).catch(() => {
            toaster.error(new UnexpectedError(t('common.notification.failedToCopyToClipboard')))
        })
    } else {
        toaster.error(t('resultVisualizer.hierarchyVisualiser.notification.noPrimaryKeyProperty'))
    }
}
function copyParentPrimaryKey(): void {
    if (props.node.parentPrimaryKey != undefined) {
        navigator.clipboard.writeText(`${props.node.parentPrimaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.hierarchyVisualiser.notification.parentPrimaryKeyCopiedToClipboard'))
        }).catch(() => {
            toaster.error(new UnexpectedError(t('common.notification.failedToCopyToClipboard')))
        })
    } else {
        toaster.error(t('resultVisualizer.hierarchyVisualiser.notification.noParentPrimaryKeyProperty'))
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
