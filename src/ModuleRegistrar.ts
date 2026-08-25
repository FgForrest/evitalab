import { ModuleContextBuilder } from '@/ModuleContextBuilder'

/**
 * Entry point of a single lab module. Each module under `src/modules/` provides one registrar that
 * publishes the module's services into the shared application context and injects the services it
 * depends on.
 *
 * All registrars are listed in `src/modules/modules.ts` and their `register` methods are called once
 * during the application bootstrap, sequentially in the listed order. A registrar may therefore only
 * inject services provided by registrars listed before it.
 */
export interface ModuleRegistrar {
    /**
     * Publishes this module's services into the passed builder and injects services of already
     * registered modules.
     */
    register(builder: ModuleContextBuilder): Promise<void>
}
