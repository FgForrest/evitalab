export enum EntityScope {
    /**
     * Entities that are currently active and reside in the live data set block.
     */
    Live='live',

    /**
     * Entities that are no longer active and reside in the archive block.
     */
    Archive='archive'
}

/**
 * Default scope to be used if not specified custom one.
 */
export const EntityScopeDefault: EntityScope = EntityScope.Live;

/**
 * Default scopes to be used if not specified custom one.
 */
export const EntityScopeDefaults: EntityScope[] = [EntityScopeDefault] as const;

/**
 * Empty array of scopes. Makes no sense in queries - filtering in no scope would always produce empty result.
 * This constant is usually used when schema is defined and particular schema part should not be made indexed in
 * any scope.
 */
export const EntityScopeNone: EntityScope[] = [];

export const EntityScopeIcons: Record<EntityScope, string> = {
    [EntityScope.Live]: 'mdi-file-search-outline',
    [EntityScope.Archive]: 'mdi-archive-search-outline',
};
