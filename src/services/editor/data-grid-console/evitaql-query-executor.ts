import { QueryExecutor } from '@/services/editor/data-grid-console/query-executor'
import { LabService } from '@/services/lab.service'
import {
    DataGridDataPointer, EntityPropertyKey,
    EntityPropertyType, FlatEntity,
    QueryResult,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { EvitaDBClient } from '@/services/evitadb-client'
import { Response } from '@/model/evitadb'

/**
 * Query executor for EvitaQL language.
 */
export class EvitaQLQueryExecutor extends QueryExecutor {
    readonly evitaDBClient: EvitaDBClient

    constructor(labService: LabService, evitaDBClient: EvitaDBClient) {
        super(labService)
        this.evitaDBClient = evitaDBClient
    }

    async executeQuery(dataPointer: DataGridDataPointer, query: string): Promise<QueryResult> {
        const urlCatalogName: string = (await this.labService.getCatalogSchema(dataPointer.connection, dataPointer.catalogName))
            .nameVariants
            .kebabCase

        const result: Response = await this.evitaDBClient.queryEntities(dataPointer.connection, urlCatalogName, query)

        return {
            entities: result?.recordPage?.data.map((entity: any) => this.flattenEntity(entity)) || [],
            totalEntitiesCount: result?.recordPage?.totalRecordCount || 0
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(entity: any): FlatEntity {
        const flattenedEntity: FlatEntity = []

        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), entity[StaticEntityProperties.PrimaryKey]])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), entity['parentEntity']?.[StaticEntityProperties.PrimaryKey]])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), entity[StaticEntityProperties.Locales] || []])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.AllLocales), entity[StaticEntityProperties.AllLocales] || []])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), entity[StaticEntityProperties.PriceInnerRecordHandling] || 'UNKNOWN'])

        const globalAttributes = entity[EntityPropertyType.Attributes]?.['global'] || {}
        for (const attributeName in globalAttributes) {
            flattenedEntity.push([EntityPropertyKey.attributes(attributeName), globalAttributes[attributeName]])
        }
        const localizedAttributes = entity[EntityPropertyType.Attributes]?.['localized'] || {}
        for (const locale in localizedAttributes) {
            // this expects that we support only one locale
            const attributesInLocale = localizedAttributes[locale]
            for (const attributeName in attributesInLocale) {
                flattenedEntity.push([EntityPropertyKey.attributes(attributeName), attributesInLocale[attributeName]])
            }
        }

        const globalAssociatedData = entity[EntityPropertyType.AssociatedData]?.['global'] || {}
        for (const associatedDataName in globalAssociatedData) {
            flattenedEntity.push([EntityPropertyKey.associatedData(associatedDataName), globalAssociatedData[associatedDataName]])
        }
        const localizedAssociatedData = entity[EntityPropertyType.AssociatedData]?.['localized'] || {}
        for (const locale in localizedAssociatedData) {
            // this expects that we support only one locale
            const associatedDataInLocale = localizedAssociatedData[locale]
            for (const associatedDataName in associatedDataInLocale) {
                flattenedEntity.push([EntityPropertyKey.associatedData(associatedDataName), associatedDataInLocale[associatedDataName]])
            }
        }

        const references = entity[EntityPropertyType.References] || {}
        for (const referenceName in references) {
            const referencesOfName = references[referenceName]
            if (referencesOfName instanceof Array) {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), referencesOfName.map(it => it['referencedPrimaryKey'])])
            } else {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), referencesOfName['referencedPrimaryKey']])
            }
        }

        return flattenedEntity
    }
}
