import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { WorkspaceModuleRegistrar } from '@/modules/workspace/WorkspaceModuleRegistrar'
import { ConnectionModuleRegistrar } from '@/modules/connection/ConnectionModuleRegistrar'
import { EntityViewerModuleRegistrar } from '@/modules/entity-viewer/EntityViewerModuleRegistrar'
import { ErrorViewerModuleRegistrar } from '@/modules/error-viewer/ErrorViewerModuleRegistrar'
import { EvitaQLConsoleModuleRegistrar } from '@/modules/evitaql-console/EvitaQLConsoleModuleRegistrar'
import { GraphQLConsoleModuleRegistrar } from '@/modules/graphql-console/GraphQLConsoleModuleRegistrar'
import { NotificationModuleRegistrar } from '@/modules/notification/NotificationModuleRegistrar'
import { SchemaViewerModuleRegistrar } from '@/modules/schema-viewer/SchemaViewerModuleRegistrar'
import { ConfigModuleRegistrar } from '@/modules/config/ConfigModuleRegistrar'
import { StorageModuleRegistrar } from '@/modules/storage/StorageModuleRegistrar'
import { WelcomeScreenModuleRegistrar } from '@/modules/welcome-screen/WelcomeScreenModuleRegistrar'
import { KeymapModuleRegistrar } from '@/modules/keymap/KeymapModuleRegistrar'
import { BackupViewerModuleRegistrar } from '@/modules/backup-viewer/BackupViewerModuleRegistrar'
import { TaskViewerModuleRegistrar } from '@/modules/task-viewer/TaskViewerModuleRegistrar'
import { ServerViewerModuleRegistrar } from '@/modules/server-viewer/ServerViewerModuleRegistrar'
import { JfrViewerModuleRegistrar } from '@/modules/jfr-viewer/JfrViewerModuleRegistrar'
import { ServerFileViewerModuleRegistrar } from '@/modules/server-file-viewer/ServerFileViewerModuleRegistrar'
import { TrafficViewerModuleRegistrar } from '@/modules/traffic-viewer/TrafficViewerModuleRegistrar'
import { ConnectionExplorerModuleRegistrar } from '@/modules/connection-explorer/ConnectionExplorerModuleRegistrar'
import { DatabaseDriverModuleRegistrar } from '@/modules/database-driver/DatabaseDriverModuleRegistrar'
import { MutationHistoryViewerModuleRegistrar } from '@/modules/history-viewer/MutationHistoryViewerModuleRegistrar.ts'

/**
 * Registers all modules during startup.
 */
export const modules: ModuleRegistrar[] = [
    // base generic modules
    new ConfigModuleRegistrar(),
    new StorageModuleRegistrar(),
    new ConnectionModuleRegistrar(),
    new DatabaseDriverModuleRegistrar(),
    new WorkspaceModuleRegistrar(),

    // UI feature modules; each of them contributes its tab factory into the workspace tab factory
    // registry, therefore modules consuming tab factories of other modules must be registered after them
    new KeymapModuleRegistrar(),
    new WelcomeScreenModuleRegistrar(),
    new ErrorViewerModuleRegistrar(),
    new NotificationModuleRegistrar(),
    new EvitaQLConsoleModuleRegistrar(),
    new GraphQLConsoleModuleRegistrar(),
    new SchemaViewerModuleRegistrar(),
    new MutationHistoryViewerModuleRegistrar(),
    new EntityViewerModuleRegistrar(),
    new ServerViewerModuleRegistrar(),
    new ServerFileViewerModuleRegistrar(),
    new BackupViewerModuleRegistrar(),
    new TaskViewerModuleRegistrar(),
    new JfrViewerModuleRegistrar(),
    new TrafficViewerModuleRegistrar(),
    new ConnectionExplorerModuleRegistrar()
]
