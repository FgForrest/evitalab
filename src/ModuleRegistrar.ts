import { App } from 'vue'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export interface ModuleRegistrar {
    register(builder: ModuleContextBuilder): void
}
