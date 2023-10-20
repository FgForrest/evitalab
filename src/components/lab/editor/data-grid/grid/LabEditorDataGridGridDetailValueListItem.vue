<script setup lang="ts">

import LabEditorDataGridGridCellDetailDelegateRenderer
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailDelegateRenderer.vue'
import LabEditorDataGridGridCellDetailOutputFormatSelector
    from '@/components/lab/editor/data-grid/grid/LabEditorDataGridGridCellDetailOutputFormatSelector.vue'
import { EntityPropertyValueDesiredOutputFormat } from '@/model/editor/data-grid'
import { ref } from 'vue'
import { Scalar } from '@/model/evitadb'

const props = defineProps<{
    value: any,
    componentDataType: Scalar
}>()

const outputFormat = ref<EntityPropertyValueDesiredOutputFormat>(EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint)
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            <div class="array-item__title">
                {{ value }}
            </div>
            <VSpacer />
            <div class="mr-2">
                <LabEditorDataGridGridCellDetailOutputFormatSelector
                    v-model="outputFormat"
                    class="mr-4"
                />
            </div>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
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

</style>
