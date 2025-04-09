import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export interface ModuleRegistrar {
    register(builder: ModuleContextBuilder): Promise<void>
}
