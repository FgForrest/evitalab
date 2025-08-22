export enum CatalogEvolutionMode {

    /**
     * When new entity is inserted and no collection of the {@link EntityContract#getType()} exists, it is silently
     * created with empty schema and with all {@link CatalogEvolutionMode} allowed.
     */
    ADDING_ENTITY_TYPES = 'addingEntitiesTypes',

}
