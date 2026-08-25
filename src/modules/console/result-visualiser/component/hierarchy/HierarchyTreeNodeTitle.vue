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
import { copyToClipboard } from '@/utils/clipboard'

const toaster: Toaster = useToaster()
const { t } = useI18n()

const props = defineProps<{
    node: VisualisedHierarchyTreeNode
}>()

async function copyPrimaryKey(): Promise<void> {
    if (props.node.primaryKey != undefined) {
        copyToClipboard(`${props.node.primaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.hierarchyVisualiser.notification.primaryKeyCopiedToClipboard')).then()
        }).catch(() => {
            toaster.error(t('common.notification.failedToCopyToClipboard')).then()
        })
    } else {
        await toaster.error(t('resultVisualizer.hierarchyVisualiser.notification.noPrimaryKeyProperty'))
    }
}
async function copyParentPrimaryKey(): Promise<void> {
    if (props.node.parentPrimaryKey != undefined) {
        copyToClipboard(`${props.node.parentPrimaryKey}`).then(() => {
            toaster.info(t('resultVisualizer.hierarchyVisualiser.notification.parentPrimaryKeyCopiedToClipboard')).then()
        }).catch(() => {
            toaster.error(t('common.notification.failedToCopyToClipboard')).then()
        })
    } else {
        await toaster.error(t('resultVisualizer.hierarchyVisualiser.notification.noParentPrimaryKeyProperty'))
    }
}
</script>

<template>
    <VListItemTitle class="node-title">
        <span class="node-title__identity">
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
            <span :class="['node-title__name', { 'node-title--requested': node.requested }]">
                {{ node.title || t('resultVisualizer.hierarchyVisualiser.label.unknown') }}
                <VTooltip v-if="!node.title" activator="parent">
                    <VMarkdown :source="t('resultVisualizer.hierarchyVisualiser.help.noRepresentativeProperty')" />
                </VTooltip>
            </span>
        </span>

        <VLazy class="node-title__chips">
            <VChipGroup column>
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
.node-title {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.5rem;
    row-gap: 0.25rem;
    align-items: center;

    // primary key and name shrink as one unit, so that a name too long for the row truncates instead of
    // dropping onto a line of its own below its own primary key
    &__identity {
        display: flex;
        flex: 0 1 auto;
        min-width: 0;
        column-gap: 0.5rem;
        align-items: center;
    }

    // `display: flex` here voids the ellipsis Vuetify puts on `.v-list-item-title`, so the name
    // truncates on its own; `min-width` must be reset because the automatic minimum size of a flex item
    // is its content, which would clip the text instead of shortening it
    &__name {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    // the chips keep their width and move to a line of their own instead of being cut; `column` wraps
    // them there rather than letting them slide out of sight in the group's scrollbar-less scroller
    &__chips {
        flex: 0 0 auto;
        max-width: 100%;

        // `column` also sets `white-space: normal` on the group: without this, a chip's own label wraps
        // and is cut by the chip's height, and the shrinking chips - not the group - absorb the squeeze
        :deep(.v-chip) {
            flex: 0 0 auto;
            white-space: nowrap;
        }
    }

    &--requested {
        color: $primary-lightest!important;
    }

}
</style>
