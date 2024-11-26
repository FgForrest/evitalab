import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { SchemaViewerTabFactory } from '@/modules/schema-viewer/viewer/workspace/service/SchemaViewerTabFactory'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { SubjectPath } from '@/modules/workspace/status-bar/model/subject-path-status/SubjectPath'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import {
    SchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/SchemaPathFactory'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import {
    CatalogSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/CatalogSchemaPathFactory'
import {
    AssociatedDataSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/AssociatedDataSchemaPathFactory'
import {
    CatalogAttributeSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/CatalogAttributeSchemaPathFactory'
import {
    EntityAttributeSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/EntityAttributeSchemaPathFactory'
import {
    EntitySchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/EntitySchemaPathFactory'
import {
    ReferenceAttributeSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/ReferenceAttributeSchemaPathFactory'
import {
    ReferenceSchemaPathFactory
} from '@/modules/schema-viewer/viewer/service/schema-path-factory/ReferenceSchemaPathFactory'

export const delegatingSchemaPathFactoryInjectionKey: InjectionKey<DelegatingSchemaPathFactory> = Symbol('DelegatingSchemaPathFactory')

/**
 * The main implementation of path factory for all schema pointers
 */
export class DelegatingSchemaPathFactory implements SchemaPathFactory<any> {

    private readonly factories: SchemaPathFactory<any>[]

    constructor(workspaceService: WorkspaceService, schemaViewerTabFactory: SchemaViewerTabFactory) {
        this.factories = [
            new AssociatedDataSchemaPathFactory(workspaceService, schemaViewerTabFactory),
            new CatalogAttributeSchemaPathFactory(workspaceService, schemaViewerTabFactory),
            new CatalogSchemaPathFactory(workspaceService, schemaViewerTabFactory),
            new EntityAttributeSchemaPathFactory(workspaceService, schemaViewerTabFactory),
            new EntitySchemaPathFactory(workspaceService, schemaViewerTabFactory),
            new ReferenceAttributeSchemaPathFactory(workspaceService, schemaViewerTabFactory),
            new ReferenceSchemaPathFactory(workspaceService, schemaViewerTabFactory)
        ]
    }

    applies(schemaPointer: SchemaPointer): boolean {
        return true
    }

    resolvePath(connection: Connection, schemaPointer: any): SubjectPath {
        const factory: SchemaPathFactory<any> | undefined = this.factories.find(factory =>
            factory.applies(schemaPointer))
        if (factory == undefined) {
            throw new UnexpectedError('Missing factory for schema pointer.')
        }
        return factory.resolvePath(connection, schemaPointer)
    }
}

export function useSchemaPathFactory(): DelegatingSchemaPathFactory {
    return mandatoryInject(delegatingSchemaPathFactoryInjectionKey)
}
