<script setup lang="ts">
/**
 * Entity property value renderer that tries to render the value in a code editor.
 */

import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { useI18n } from 'vue-i18n'
import { useToaster } from '@/modules/notification/service/Toaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { EntityViewerService, useEntityViewerService } from '@/modules/entity-viewer/viewer/service/EntityViewerService'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import {
    EntityPropertyValueSupportedCodeLanguage
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueSupportedCodeLanguage'
import {
    CodeDetailRendererMenuItemType
} from '@/modules/entity-viewer/viewer/model/entity-grid/detail-renderer/CodeDetailRendererMenuItemType'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import ValueDetailRenderer
    from '@/modules/entity-viewer/viewer/component/entity-grid/detail-renderer/ValueDetailRenderer.vue'
import VPreviewEditor from '@/modules/code-editor/component/VPreviewEditor.vue'
import {
    CodeDetailRendererMenuFactory,
    useCodeDetailRendererMenuFactory
} from '@/modules/entity-viewer/viewer/service/CodeDetailRendererMenuFactory'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'

const toaster: Toaster = useToaster()
const entityViewerService: EntityViewerService = useEntityViewerService()
const codeDetailRendererMenuFactory: CodeDetailRendererMenuFactory = useCodeDetailRendererMenuFactory()
const { t } = useI18n()

const props = withDefaults(defineProps<{
    value: EntityPropertyValue | EntityPropertyValue[],
    codeLanguage?: EntityPropertyValueSupportedCodeLanguage,
    fillSpace?: boolean
}>(), {
    codeLanguage: EntityPropertyValueSupportedCodeLanguage.Raw,
    fillSpace: true
})

const prettyPrint = ref<boolean>(true)

const menuItems = ref<Map<CodeDetailRendererMenuItemType, MenuItem<CodeDetailRendererMenuItemType>>>()
const menuItemList: ComputedRef<MenuItem<CodeDetailRendererMenuItemType>[]> = computed(() => {
    if (menuItems.value == undefined) {
        return []
    }
    return Array.from(menuItems.value.values())
})
watch(
    [() => props.codeLanguage, prettyPrint],
    async () => menuItems.value = await createMenuItems(),
    { immediate: true }
)

const formattedValue = computed<string>(() => {
    try {
        return entityViewerService.formatEntityPropertyValue(props.value, props.codeLanguage, prettyPrint.value)
    } catch (e: any) {
        console.error(e)
        return t(
            'entityViewer.grid.codeRenderer.placeholder.failedToFormatValue',
            {
                codeLanguage: props.codeLanguage,
                message: e?.message ? `${e.message}.` : ''
            }
        )
    }
})
const codeBlockExtensions = computed<Extension[]>(() => {
    if (!formattedValue.value) {
        return []
    }
    switch (props.codeLanguage) {
        case EntityPropertyValueSupportedCodeLanguage.Raw:
            return []
        case EntityPropertyValueSupportedCodeLanguage.Json:
            return [json()]
        case EntityPropertyValueSupportedCodeLanguage.Xml:
            return [xml()]
        default:
            toaster.error(t('entityViewer.grid.codeRenderer.notification.unsupportedCodeLanguage'))
                .then()
            return []
    }
})

function handleActionClick(action: any) {
    const foundedAction = menuItems.value?.get(action as CodeDetailRendererMenuItemType)
    if (foundedAction && foundedAction instanceof MenuAction) {
        (foundedAction as MenuAction<CodeDetailRendererMenuItemType>).execute()
    }
}

function copyRenderedValue() {
    navigator.clipboard.writeText(formattedValue.value).then(() => {
        toaster.info(t('common.notification.copiedToClipboard')).then()
    }).catch(() => {
        toaster.error(t('common.notification.failedToCopyToClipboard')).then()
    })
}

async function createMenuItems(): Promise<Map<CodeDetailRendererMenuItemType, MenuItem<CodeDetailRendererMenuItemType>>> {
    return await codeDetailRendererMenuFactory.createItems(
        props.codeLanguage,
        prettyPrint.value,
        () => copyRenderedValue(),
        () => prettyPrint.value = !prettyPrint.value
    )
}
</script>

<template>
    <ValueDetailRenderer
        :fill-space="fillSpace"
        :actions="menuItemList"
        @click:action="handleActionClick"
    >
        <VPreviewEditor
            :model-value="formattedValue"
            :additional-extensions="codeBlockExtensions"
        />
    </ValueDetailRenderer>
</template>

<style lang="scss" scoped>

</style>
