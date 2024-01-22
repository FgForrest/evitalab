<script setup lang="ts">

import LabEditorDataGridGridCellDetailDelegateRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailDelegateRenderer.vue'
import LabEditorDataGridGridCellDetailOutputFormatSelector
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailOutputFormatSelector.vue'
import { EntityPropertyValue, EntityPropertyValueDesiredOutputFormat } from '@/model/editor/data-grid'
import { computed, ref } from 'vue'
import { Scalar } from '@/model/evitadb'

const props = defineProps<{
    value: EntityPropertyValue,
    componentDataType: Scalar
}>()

const outputFormat = ref<EntityPropertyValueDesiredOutputFormat>(EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint)
const previewString = computed(() => props.value.toPreviewString())
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            <template v-if="previewString == undefined">
                <span class="text-disabled">&lt;null&gt;</span>
            </template>
            <template v-else>
                <div class="array-item__title">
                    {{ previewString }}
                </div>
                <VSpacer />
                <div class="mr-2">
                    <LabEditorDataGridGridCellDetailOutputFormatSelector
                        v-model="outputFormat"
                        class="mr-4"
                    />
                </div>
            </template>
        </VExpansionPanelTitle>

        <VExpansionPanelText v-if="previewString != undefined">
            <div class="array-item__content">
                <LabEditorDataGridGridCellDetailDelegateRenderer
                    :data-type="componentDataType"
                    :value="value"
                    :output-format="outputFormat"
                    :fill-space="false"
                />
            </div>
        </VExpansionPanelText>
    </VExpansionPanel>
</template>

<style lang="scss" scoped>
.array-item__title {
    text-overflow: ellipsis;
    text-wrap: nowrap;
    overflow: hidden;
    padding-right: 1rem;
}
.array-item__content {
    position: relative;
}
</style>
