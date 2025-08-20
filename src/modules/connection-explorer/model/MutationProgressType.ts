/**
 * Internal running process type representation
 */
export enum MutationProgressType {
    Duplication = 'duplication',
    Renaming = 'renaming',
    Replacing = 'replacing',
    Activation = 'activation',
    Deactivation = 'deactivation',
    Mutable = 'mutable',
    Immutable = 'immutable',
    Alive = 'alive'
}
