import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { i18n } from '@/vue-plugins/i18n'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import {
    MarkdownDetailRendererMenuItemType
} from '@/modules/entity-viewer/viewer/model/entity-grid/detail-renderer/MarkdownDetailRendererMenuItemType'

export const markdownDetailRendererMenuFactoryInjectionKey: InjectionKey<MarkdownDetailRendererMenuFactory> = Symbol('MarkdownDetailRendererMenuFactory')

export function useMarkdownDetailRendererMenuFactory(): MarkdownDetailRendererMenuFactory {
    return mandatoryInject(markdownDetailRendererMenuFactoryInjectionKey)
}

/**
 * This class is responsible for creating menus for code detail renderers.
 * It extends `MenuFactory` with a specialization for `CodeDetailRendererMenuItemType`.
 * The menu items include options like copying the rendered value and toggling pretty print mode,
 * based on the provided configurations and callbacks.
 */
export class MarkdownDetailRendererMenuFactory extends MenuFactory<MarkdownDetailRendererMenuItemType> {

    constructor() {
        super()
    }

    createItems(
        prettyPrint?: boolean,
        copyRenderedValueCallback?: () => void,
        prettyPrintCallback?: () => void,
    ): Map<MarkdownDetailRendererMenuItemType, MenuItem<MarkdownDetailRendererMenuItemType>> {
        if (prettyPrint == undefined) throw new Error('Pretty print value is required.')
        if (copyRenderedValueCallback == undefined) throw new Error('Copy rendered value callback is required.')
        if (prettyPrintCallback == undefined) throw new Error('Pretty print callback is required.')

        const items: Map<MarkdownDetailRendererMenuItemType, MenuItem<MarkdownDetailRendererMenuItemType>> = new Map()
        this.createMenuAction(
            items,
            MarkdownDetailRendererMenuItemType.Copy,
            'mdi-content-copy',
            () => i18n.global.t('common.button.copy'),
            () => copyRenderedValueCallback()
        )
        this.createMenuAction(
            items,
            MarkdownDetailRendererMenuItemType.PrettyPrint,
            prettyPrint
                ? 'mdi-raw'
                : 'mdi-auto-fix',
            () => prettyPrint
                ? i18n.global.t('entityViewer.grid.renderer.button.displayRawValue')
                : i18n.global.t('entityViewer.grid.renderer.button.prettyPrintValue'),
            () => prettyPrintCallback()
        )

        return items
    }
}
