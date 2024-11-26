// todo lho
import { SchemaViewerTabParams } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabParams'
import { Connection } from '@/modules/connection/model/Connection'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { SchemaViewerTabDefinition } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabDefinition'
import { SchemaViewerTabParamsDto } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabParamsDto'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { SchemaPointerType } from '@/modules/schema-viewer/viewer/model/SchemaPointerType'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const schemaViewerTabFactoryInjectionKey: InjectionKey<SchemaViewerTabFactory> = Symbol('schemaViewerTabFactory')

export class SchemaViewerTabFactory {

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    createNew(connection: Connection,
              schemaPointer: SchemaPointer): SchemaViewerTabDefinition {
        return new SchemaViewerTabDefinition(
            this.constructTitle(connection, schemaPointer),
            new SchemaViewerTabParams(
                new SchemaViewerDataPointer(connection, schemaPointer)
            )
        )
    }

    restoreFromJson(paramsJson: TabParamsDto): SchemaViewerTabDefinition {
        const params: SchemaViewerTabParams = this.restoreTabParamsFromSerializable(paramsJson)

        return new SchemaViewerTabDefinition(
            this.constructTitle(params.dataPointer.connection, params.dataPointer.schemaPointer),
            params
        )
    }

    private restoreTabParamsFromSerializable(json: TabParamsDto): SchemaViewerTabParams {
        const dto: SchemaViewerTabParamsDto = json as SchemaViewerTabParamsDto

        const schemaPointerType: SchemaPointerType = dto.schemaPointer.type
        const schemaPointerParams: any = dto.schemaPointer.params
        let schemaPointer: SchemaPointer
        switch (schemaPointerType) {
            case SchemaPointerType.CatalogSchema:
                schemaPointer = new CatalogSchemaPointer(schemaPointerParams.catalogName)
                break
            case SchemaPointerType.EntitySchema:
                schemaPointer = new EntitySchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType)
                break
            case SchemaPointerType.CatalogAttributeSchema:
                schemaPointer = new CatalogAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.attributeName)
                break
            case SchemaPointerType.EntityAttributeSchema:
                schemaPointer = new EntityAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.attributeName)
                break
            case SchemaPointerType.ReferenceAttributeSchema:
                schemaPointer = new ReferenceAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.referenceName, schemaPointerParams.attributeName)
                break
            case SchemaPointerType.AssociatedDataSchema:
                schemaPointer = new AssociatedDataSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.associatedDataName)
                break
            case SchemaPointerType.ReferenceSchema:
                schemaPointer = new ReferenceSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.referenceName)
                break
            default:
                throw new UnexpectedError('Unknown schema pointer type.')
        }

        return new SchemaViewerTabParams(
            new SchemaViewerDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                schemaPointer
            )
        )
    }


    private constructTitle(connection: Connection, schemaPointer: SchemaPointer): string {
        return `${schemaPointer.schemaName} [${connection.name}]`
    }
}

export const useSchemaViewerTabFactory = (): SchemaViewerTabFactory => {
    return mandatoryInject(schemaViewerTabFactoryInjectionKey) as SchemaViewerTabFactory
}
