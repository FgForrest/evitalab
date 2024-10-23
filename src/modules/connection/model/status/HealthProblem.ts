/**
 * evitaLab representation of health problem types of server.
 */
export enum HealthProblem {
    MemoryShortage = 'memoryShortage',
    ExternalApiUnavailable = 'externalApiUnavailable',
    InputQueuesOverloaded = 'inputQueuesOverloaded',
    JavaInternalErrors = 'javaInternalErrors'
}
