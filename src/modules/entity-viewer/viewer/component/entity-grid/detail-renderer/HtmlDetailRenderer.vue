<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value as HTML.
 */

import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { useI18n } from 'vue-i18n'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import ValueDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ValueDetailRenderer.vue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    fillSpace?: boolean
}>(), {
    fillSpace: true
})

const formattedValue = computed<string>(() => {
    if (props.value instanceof Array || typeof (props.value as EntityPropertyValue).value() !== 'string') {
        return t('entityViewer.grid.htmlRenderer.placeholder.failedToRenderHtml')
    }
    return DOMPurify.sanitize((props.value as EntityPropertyValue).toPreviewString())
})

</script>

<template>
    <ValueDetailRenderer :fill-space="fillSpace">
        <div class="html-renderer">
            <div v-html="formattedValue"/>
        </div>
    </ValueDetailRenderer>
</template>

<style lang="scss" scoped>
.html-renderer {
    padding: 1rem;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow: auto;
}
</style>
