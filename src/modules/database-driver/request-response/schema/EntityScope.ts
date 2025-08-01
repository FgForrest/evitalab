export enum EntityScope {
    Live='live',
    Archive='archive'
}

export const EntityScopeIcons: Record<EntityScope, string> = {
    [EntityScope.Live]: 'mdi-file-search-outline',
    [EntityScope.Archive]: 'mdi-archive-search-outline',
};
