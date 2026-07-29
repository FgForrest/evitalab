import { ref, type Ref } from 'vue'
import {
    ConflictResolution
} from '@/modules/database-driver/request-response/schema/ConflictResolution.ts'
import {
    useSchemaViewerService,
    type SchemaViewerService
} from '@/modules/schema-viewer/viewer/service/SchemaViewerService.ts'
import { useToaster, type Toaster } from '@/modules/notification/service/Toaster.ts'
import { i18n } from '@/vue-plugins/i18n.ts'
import { asError } from '@/utils/error.ts'

/**
 * Loads the engine-wide default conflict resolution the connected server reports. It is configurable per
 * server, so it is always read from the server and never assumed; until it arrives (or if it cannot be
 * read at all) the ref stays undefined and callers must omit the rows that depend on it rather than
 * render a guessed default.
 */
export function useDefaultConflictResolution(): Ref<ConflictResolution | undefined> {
    const toaster: Toaster = useToaster()
    const schemaViewerService: SchemaViewerService = useSchemaViewerService()

    const defaultConflictResolution: Ref<ConflictResolution | undefined> = ref<ConflictResolution>()

    schemaViewerService
        .getDefaultConflictResolution()
        .then(resolution => defaultConflictResolution.value = resolution)
        .catch(e => toaster.error(
            i18n.global.t('schemaViewer.conflictResolution.notification.failedToResolvePolicy'),
            asError(e)
        ))

    return defaultConflictResolution
}
