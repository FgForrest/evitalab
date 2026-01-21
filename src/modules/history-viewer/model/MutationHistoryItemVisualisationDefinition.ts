import { List as ImmutableList } from 'immutable'
import { i18n } from '@/vue-plugins/i18n'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import type {
    MutationHistoryMetadataItemContext
} from '@/modules/history-viewer/model/MutationHistoryMetadataItemContext.ts'

/**
 * Defines how a particular mutation history record should be displayed in UI
 */
export class MutationHistoryItemVisualisationDefinition {

    readonly source: ChangeCatalogCapture

    readonly icon: string|undefined
    readonly title: string
    readonly details?: string
    readonly tooltip?: string
    metadata: MetadataGroup[]
    readonly actions: ImmutableList<Action>
    private readonly _children: MutationHistoryItemVisualisationDefinition[] = []

    constructor(source: ChangeCatalogCapture,
                icon: string | undefined,
                title: string,
                details: string | undefined,
                tooltip: string | undefined,
                metadata: MetadataGroup[], actions: Immutable.List<Action>) {
        this.source = source
        this.icon = icon
        this.title = title
        this.tooltip = tooltip
        this.details = details
        this.metadata = metadata
        this.actions = actions
    }

    addChild(childRecord: MutationHistoryItemVisualisationDefinition): void {
        this._children.push(childRecord)
    }

    get children(): ImmutableList<MutationHistoryItemVisualisationDefinition> {
        return ImmutableList(this._children)
    }

}

export const metadataItemSessionIdIdentifier: string = 'sessionId'
export const metadataItemCreatedIdentifier: string = 'created'
export const metadataItemIoFetchCountIdentifier: string = 'ioFetchCount'

export class MetadataItem {
    readonly identifier: string | undefined
    readonly icon: string
    readonly tooltip: string
    readonly value: string
    readonly severity: MetadataItemSeverity
    readonly details?: string
    readonly onClickCallback?: (ctx: MutationHistoryMetadataItemContext) => void

    constructor(identifier: string | undefined,
                icon: string,
                tooltip: string,
                value: string,
                severity?: MetadataItemSeverity,
                details?: string,
                onClickCallback?: (ctx: MutationHistoryMetadataItemContext) => void) {
        this.identifier = identifier
        this.icon = icon
        this.tooltip = tooltip
        this.value = value
        this.severity = severity || MetadataItemSeverity.Info
        this.details = details
        this.onClickCallback = onClickCallback
    }

    static area(area: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            area === 'infrastructure' ? 'mdi-graph-outline' : 'mdi-table',
            i18n.global.t('mutationHistoryViewer.record.type.area.tooltip'),
            area?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    // todo vstupuje sem i transaction
    static operation(operationType: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.operation.tooltip'),
            operationType?.toString(),
            operationType === 'remove' ? MetadataItemSeverity.Error : MetadataItemSeverity.Success,
            undefined,
            undefined
        )
    }


    static entityType(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.entityType.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static version(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-source-commit',
            i18n.global.t('mutationHistoryViewer.record.type.version.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static entityPrimaryKey(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-identifier',
            i18n.global.t('mutationHistoryViewer.record.type.entityPrimaryKey.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static index(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.index.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }
}

export const defaultMetadataGroupIdentifier: string = 'default'

export class MetadataGroup {

    readonly identifier?: string
    readonly icon: string
    readonly tooltip: string
    readonly title?: string
    items: MetadataItem[]

    constructor(identifier: string | undefined, icon: string, tooltip: string, title: string | undefined, items: MetadataItem[]) {
        this.identifier = identifier
        this.icon = icon
        this.tooltip = tooltip
        this.title = title
        this.items = items
    }

    static default(items: MetadataItem[]): MetadataGroup {
        return new MetadataGroup(
            defaultMetadataGroupIdentifier,
            'mdi-format-list-bulleted',
            i18n.global.t('mutationHistoryViewer.record.type.common.metadata.group.default'),
            undefined,
            items
        )
    }
}

export enum MetadataItemSeverity {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
    Info = 'info'
}

export class Action {
    readonly title: string
    readonly icon: string
    readonly buttonType: 'icon' | 'full' = 'icon'
    readonly callback?: () => void

    constructor(title: string, icon: string, buttonType: 'icon' | 'full', callback?: (() => void)  ) {
        this.title = title
        this.icon = icon
        this.buttonType = buttonType
        this.callback = callback
    }
}
