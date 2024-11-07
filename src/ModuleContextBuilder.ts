// todo docs
// todo lho revise
import { App, InjectionKey } from 'vue'
import { InitializationError } from '@/modules/base/exception/InitializationError'

export class ModuleContextBuilder {

    readonly app: App
    private readonly resourceIndex: Map<string, any> = new Map()

    constructor(app: App) {
        this.app = app
    }

    provide<T>(injectionKey: InjectionKey<T>, resource: T): void {
        if (injectionKey.description == undefined) {
            throw new InitializationError('Injection key must have globally unique description.')
        }
        if (this.resourceIndex.has(injectionKey.description)) {
            throw new InitializationError(`There is already provided resource with key '${injectionKey.description}'.`)
        }
        this.app.provide(injectionKey, resource)
        this.resourceIndex.set(injectionKey.description, resource)
    }

    inject<T>(injectionKey: InjectionKey<T>): T {
        if (injectionKey.description == undefined) {
            throw new InitializationError('Injection key must have globally unique description.')
        }
        return this.resourceIndex.get(injectionKey.description)
    }
}
