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

export namespace EntityScope {
    /**
     * Default scope to be used if not specified custom one.
     */
    export const DefaultScope:EntityScope = EntityScope.Live;

    /**
     * Default scopes to be used if not specified custom one.
     */
    export const DefaultScopes:EntityScope[] = [DefaultScope] as const;

    /**
     * Empty array of scopes. Makes no sense in queries - filtering in no scope would always produce empty result.
     * This constant is usually used when schema is defined and particular schema part should not be made indexed in
     * any scope.
     */
    export const NoScope: EntityScope[] = [];
}

export const EntityScopeIcons: Record<EntityScope, string> = {
    [EntityScope.Live]: 'mdi-file-search-outline',
    [EntityScope.Archive]: 'mdi-archive-search-outline',
};
