/**
 * evitaLab representation of server readiness types
 */
export enum Readiness {
    Starting = 'starting',
    Ready = 'ready',
    Stalling = 'stalling',
    Shutdown = 'shutdown',
    Unknown = 'unknown'
}
