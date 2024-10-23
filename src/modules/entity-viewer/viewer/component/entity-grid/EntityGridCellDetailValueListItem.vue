<script setup lang="ts">

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import {
    EntityPropertyValueDesiredOutputFormat
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueDesiredOutputFormat'
import DetailOutputFormatSelector
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/DetailOutputFormatSelector.vue'
import DelegateDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/DelegateDetailRenderer.vue'

const { t } = useI18n()

const props = defineProps<{
    value: EntityPropertyValue,
    componentDataType: Scalar
}>()

const outputFormat = ref<EntityPropertyValueDesiredOutputFormat>(EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint)
const previewString = computed(() => props.value.toPrettyPrintString())
</script>

<template>
    <VExpansionPanel>
        <VExpansionPanelTitle>
            <template v-if="previewString == undefined">
                <span class="text-disabled">{{ t('common.placeholder.null') }}</span>
            </template>
            <template v-else>
                <div class="array-item__title">
                    {{ previewString }}
                </div>
                <VSpacer />
                <div class="mr-2">
                    <DetailOutputFormatSelector
                        v-model="outputFormat"
                        class="mr-4"
                    />
                </div>
            </template>
        </VExpansionPanelTitle>

        <VExpansionPanelText v-if="previewString != undefined">
            <div class="array-item__content">
                <DelegateDetailRenderer
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
