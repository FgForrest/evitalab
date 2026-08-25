import type { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import type { AnyTabDefinition } from '@/modules/workspace/tab/model/TabDefinition'

/**
 * Contract a tab factory of a feature module must fulfil to be contributed into the
 * {@link TabFactoryRegistry}. It allows the workspace to reconstruct tabs of any feature module
 * without knowing their concrete types.
 */
export interface TabFactory {

    /**
     * Canonical type of tabs created by this factory.
     */
    readonly tabType: TabType

    /**
     * Historical ids of {@link tabType} that may still occur in sessions persisted by or links shared
     * from older evitaLab versions.
     */
    readonly legacyTabTypeIds?: readonly string[]

    /**
     * Whether tabs created by this factory can be reconstructed from their serialized form. Tabs that
     * are not restorable are neither persisted between sessions nor shareable.
     */
    readonly restorable: boolean

    /**
     * Reconstructs a tab definition from its serialized form.
     */
    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): AnyTabDefinition
}
