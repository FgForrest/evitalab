import type { InjectionKey } from 'vue'
import { MenuFactory } from '@/modules/base/service/menu/MenuFactory'
import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { ManageOptionType } from '@/modules/workspace/panel/model/ManageOptionType'
import { Command } from '@/modules/keymap/model/Command'
import { i18n } from '@/vue-plugins/i18n'
import { mandatoryInject } from '@/utils/reactivity'

export const manageMenuFactoryInjectionKey: InjectionKey<ManageMenuFactory> = Symbol('manageMenuFactory')

export function useManageMenuFactory(): ManageMenuFactory {
    return mandatoryInject(manageMenuFactoryInjectionKey)
}

const evitaLabGithubUrl: string = 'https://github.com/FgForrest/evitalab'
const evitaDBGithubUrl: string = 'https://github.com/FgForrest/evitaDB'
const evitaDBDocumentationUrl: string = 'https://evitadb.io/documentation'
const discordUrl: string = 'https://discord.gg/VsNBWxgmSw'

/**
 * Creates the content of the manage menu of the workspace panel: evitaLab's own settings and the links to
 * help for both evitaLab and evitaDB.
 */
export class ManageMenuFactory extends MenuFactory<ManageOptionType> {

    constructor() {
        super()
    }

    /**
     * @param openKeymapCallback opens the keymap viewer. It is passed in rather than injected, because the
     * keymap module is registered after the workspace one and its tab factory is not available here yet.
     */
    async createItems(openKeymapCallback?: () => void): Promise<Map<ManageOptionType, MenuItem<ManageOptionType>>> {
        if (openKeymapCallback == undefined) throw new Error('Open keymap callback is required.')

        const items: Map<ManageOptionType, MenuItem<ManageOptionType>> = new Map()

        this.createMenuSubheader(items, ManageOptionType.ManageSubheader, this.getItemTitle)
        this.createMenuAction(
            items,
            ManageOptionType.Keymap,
            'mdi-keyboard-outline',
            this.getItemTitle,
            () => openKeymapCallback(),
            true,
            Command.System_Keymap
        )

        this.createMenuSubheader(items, ManageOptionType.EvitaLabHelpSubheader, this.getItemTitle)
        this.createLinkAction(items, ManageOptionType.EvitaLabGithub, 'mdi-github', evitaLabGithubUrl)
        this.createLinkAction(items, ManageOptionType.DiscussEvitaLab, 'mdi-forum-outline', discordUrl)
        this.createLinkAction(items, ManageOptionType.ReportEvitaLabIssue, 'mdi-bug', `${evitaLabGithubUrl}/issues`)

        this.createMenuSubheader(items, ManageOptionType.EvitaDBHelpSubheader, this.getItemTitle)
        this.createLinkAction(items, ManageOptionType.EvitaDBDocumentation, 'mdi-book-open-variant', evitaDBDocumentationUrl)
        this.createLinkAction(items, ManageOptionType.EvitaDBGithub, 'mdi-github', evitaDBGithubUrl)
        this.createLinkAction(items, ManageOptionType.DiscussEvitaDB, 'mdi-forum-outline', discordUrl)
        this.createLinkAction(items, ManageOptionType.ReportEvitaDBIssue, 'mdi-bug', `${evitaDBGithubUrl}/issues`)

        return items
    }

    private createLinkAction(items: Map<ManageOptionType, MenuItem<ManageOptionType>>,
                             option: ManageOptionType,
                             prependIcon: string,
                             url: string): void {
        this.createMenuAction(
            items,
            option,
            prependIcon,
            this.getItemTitle,
            () => window.open(url, '_blank')
        )
    }

    protected getItemTitle(itemType: ManageOptionType): string {
        return i18n.global.t(`panel.manage.menu.item.${itemType}`)
    }
}
