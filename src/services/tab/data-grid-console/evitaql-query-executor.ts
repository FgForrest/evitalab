import { QueryExecutor } from '@/services/tab/data-grid-console/query-executor'
import ky from 'ky'
import { LabService } from '@/services/lab.service'
import {
    DataGridDataPointer, EntityPropertyKey,
    EntityPropertyType, FlatEntity,
    QueryResult,
    StaticEntityProperties
} from '@/model/tab/data-grid-console'

/**
 * Query executor for EvitaQL language.
 */
export class EvitaQLQueryExecutor extends QueryExecutor {

    constructor(labService: LabService) {
        super(labService)
    }

    async executeQuery(dataPointer: DataGridDataPointer, query: string): Promise<QueryResult> {
        const urlCatalogName: string = (await this.labService.getCatalogSchema(dataPointer.connection, dataPointer.catalogName))
            .nameVariants
            .kebabCase

        const result = await ky.post(
            `${dataPointer.connection.restUrl}/${urlCatalogName}/entity/query`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ query })
            },
        )
            .json()

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

        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), this.deserializePropertyValue(entity[StaticEntityProperties.PrimaryKey])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Parent), this.deserializePropertyValue(entity[StaticEntityProperties.Parent])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), this.deserializePropertyValue(entity[StaticEntityProperties.Locales])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.AllLocales), this.deserializePropertyValue(entity[StaticEntityProperties.AllLocales])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), this.deserializePropertyValue(entity[StaticEntityProperties.PriceInnerRecordHandling])])

        const globalAttributes = entity[EntityPropertyType.Attributes]?.['global'] || {}
        for (const attributeName in globalAttributes) {
            flattenedEntity.push([EntityPropertyKey.attributes(attributeName), this.deserializePropertyValue(globalAttributes[attributeName])])
        }
        const localizedAttributes = entity[EntityPropertyType.Attributes]?.['localized'] || {}
        for (const locale in localizedAttributes) {
            // this expects that we support only one locale
            const attributesInLocale = localizedAttributes[locale]
            for (const attributeName in attributesInLocale) {
                flattenedEntity.push([EntityPropertyKey.attributes(attributeName), this.deserializePropertyValue(attributesInLocale[attributeName])])
            }
        }

        const globalAssociatedData = entity[EntityPropertyType.AssociatedData]?.['global'] || {}
        for (const associatedDataName in globalAssociatedData) {
            flattenedEntity.push([EntityPropertyKey.associatedData(associatedDataName), this.deserializePropertyValue(globalAssociatedData[associatedDataName])])
        }
        const localizedAssociatedData = entity[EntityPropertyType.AssociatedData]?.['localized'] || {}
        for (const locale in localizedAssociatedData) {
            // this expects that we support only one locale
            const associatedDataInLocale = localizedAssociatedData[locale]
            for (const associatedDataName in associatedDataInLocale) {
                flattenedEntity.push([EntityPropertyKey.associatedData(associatedDataName), this.deserializePropertyValue(associatedDataInLocale[associatedDataName])])
            }
        }

        const references = entity[EntityPropertyType.References] || {}
        for (const referenceName in references) {
            const referencesOfName = references[referenceName]
            if (referencesOfName instanceof Array) {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), this.deserializePropertyValue(referencesOfName.map(it => it['referencedPrimaryKey']))])
            } else {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), this.deserializePropertyValue(referencesOfName['referencedPrimaryKey'])])
            }
        }

        return flattenedEntity
    }
}
