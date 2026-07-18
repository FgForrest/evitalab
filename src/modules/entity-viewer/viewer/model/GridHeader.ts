import type { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'

/**
 * A single column header of the entity data grid, derived from an entity property
 * descriptor and passed to the underlying Vuetify data table.
 */
export interface GridHeader {
    key: string
    title: string
    sortable: boolean
    descriptor: EntityPropertyDescriptor
}
