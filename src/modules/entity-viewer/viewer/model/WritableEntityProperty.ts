import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'

/**
 * Represents a single entity property with its key and value. It should be used only for gradual initialization of a new entity.
 */
export type WritableEntityProperty = [EntityPropertyKey, EntityPropertyValue | EntityPropertyValue[]]
