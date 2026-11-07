import { List as ImmutableList, OrderedMap as ImmutableOrderedMap } from 'immutable'
import type { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import type { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'

/**
 * All properties of one entity collection in display order, in the two shapes the entity viewer needs:
 * a flat {@link index} (grid columns, key lookups) and a tree {@link sections} grouped by property type (property
 * selector). Both views share the same descriptor instances: a reference descriptor's `children` are the very
 * objects that also appear in {@link index} under their own keys.
 *
 * The display order is the order of the list passed to the constructor. Both views use ordered collections
 * on purpose — an Immutable `Map` does not keep insertion order beyond 8 entries.
 */
export class EntityPropertyDescriptors {

    private static readonly EMPTY: EntityPropertyDescriptors = new EntityPropertyDescriptors(ImmutableList())

    /**
     * Every property including reference attributes, keyed by `EntityPropertyKey.toString()`, in display order.
     */
    readonly index: ImmutableOrderedMap<string, EntityPropertyDescriptor>
    /**
     * Top-level properties grouped by type, in display order. There is no `ReferenceAttributes` section, reference
     * attributes are reachable through the `children` of their reference.
     */
    readonly sections: ImmutableOrderedMap<EntityPropertyType, ImmutableList<EntityPropertyDescriptor>>

    /**
     * @param descriptors flat list of all properties in display order, each reference immediately followed by its
     *                    reference attributes (the same instances as in the reference's `children`)
     */
    constructor(descriptors: ImmutableList<EntityPropertyDescriptor>) {
        this.index = ImmutableOrderedMap<string, EntityPropertyDescriptor>(
            descriptors.map(descriptor => [descriptor.key.toString(), descriptor] as [string, EntityPropertyDescriptor])
        )
        this.sections = ImmutableOrderedMap<EntityPropertyType, ImmutableList<EntityPropertyDescriptor>>().withMutations(sections => {
            descriptors
                .filter(descriptor => descriptor.type !== EntityPropertyType.ReferenceAttributes)
                .forEach(descriptor => {
                    sections.set(
                        descriptor.type,
                        (sections.get(descriptor.type) ?? ImmutableList<EntityPropertyDescriptor>()).push(descriptor)
                    )
                })
        })
    }

    /**
     * Descriptors of a collection that has not been loaded yet.
     */
    static empty(): EntityPropertyDescriptors {
        return EntityPropertyDescriptors.EMPTY
    }

    /**
     * Returns the descriptor of the property with the given key (or its string form), `undefined` if unknown.
     */
    get(key: EntityPropertyKey | string): EntityPropertyDescriptor | undefined {
        return this.index.get(key.toString())
    }

    /**
     * Whether the collection has a property with the given key (or its string form).
     */
    has(key: EntityPropertyKey | string): boolean {
        return this.index.has(key.toString())
    }

    /**
     * Returns the given keys in display order. Unknown keys and duplicates are dropped and every key is replaced by
     * the index's own instance, so the result can be compared by identity with the keys of the descriptors (which
     * e.g. `VList` selection does).
     */
    order(keys: EntityPropertyKey[]): EntityPropertyKey[] {
        const requested: Set<string> = new Set(keys.map(key => key.toString()))
        const ordered: EntityPropertyKey[] = []
        this.index.forEach((descriptor, key) => {
            if (requested.has(key)) {
                ordered.push(descriptor.key)
            }
        })
        return ordered
    }
}
