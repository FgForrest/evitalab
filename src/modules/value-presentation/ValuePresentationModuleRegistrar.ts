import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    EvitaValuePrinter,
    evitaValuePrinterInjectionKey
} from '@/modules/value-presentation/service/EvitaValuePrinter'

export class ValuePresentationModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        builder.provide(evitaValuePrinterInjectionKey, new EvitaValuePrinter())
    }

}
