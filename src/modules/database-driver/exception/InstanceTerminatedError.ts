/**
 * Exception is used when there is attempt to call a resource (for example {@link EvitaClient} or {@link EvitaClientSession}
 * that has been already terminated and released all its resources that are required to service the call.
 */
export class InstanceTerminatedError extends Error {

    constructor(instanceSpecification: string) {
        super(`Evita ${instanceSpecification} has been already terminated! No calls are accepted since all resources has been released.`)
        this.name = 'InstanceTerminatedError'
    }
}
