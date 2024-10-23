<script setup lang="ts">

import { Scalar } from '@/modules/connection/model/data-type/Scalar'
import { ExtraEntityObjectType } from '@/modules/entity-viewer/viewer/model/ExtraEntityObjectType'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import {
    EntityPropertyValueDesiredOutputFormat
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueDesiredOutputFormat'
import AutoPrettyPrintDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/AutoPrettyPrintDetailRenderer.vue'
import MarkdownDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/MarkdownDetailRenderer.vue'
import CodeDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/CodeDetailRenderer.vue'
import {
    EntityPropertyValueSupportedCodeLanguage
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueSupportedCodeLanguage'
import HtmlDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/HtmlDetailRenderer.vue'

const props = withDefaults(defineProps<{
    dataType?: Scalar | ExtraEntityObjectType | undefined,
    value: EntityPropertyValue | EntityPropertyValue[],
    outputFormat?: EntityPropertyValueDesiredOutputFormat,
    fillSpace?: boolean
}>(), {
    outputFormat: EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint,
    fillSpace: true
})
</script>

<template>
    <AutoPrettyPrintDetailRenderer
        v-if="outputFormat === EntityPropertyValueDesiredOutputFormat.AutoPrettyPrint"
        :data-type="dataType"
        :value="value"
        :fill-space="fillSpace"
    />
    <MarkdownDetailRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Markdown"
        :value="value"
        :data-type="dataType"
        :fill-space="fillSpace"
    />
    <CodeDetailRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Raw"
        :value="value"
        :fill-space="fillSpace"
    />
    <CodeDetailRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Json"
        :value="value"
        :code-language="EntityPropertyValueSupportedCodeLanguage.Json"
        :fill-space="fillSpace"
    />
    <CodeDetailRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Xml"
        :value="value"
        :code-language="EntityPropertyValueSupportedCodeLanguage.Xml"
        :fill-space="fillSpace"
    />
    <HtmlDetailRenderer
        v-else-if="outputFormat === EntityPropertyValueDesiredOutputFormat.Html"
        :value="value"
        :fill-space="fillSpace"
    />
</template>

<style lang="scss" scoped>

</style>
