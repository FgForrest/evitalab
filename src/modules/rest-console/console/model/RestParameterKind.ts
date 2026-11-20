/**
 * Shape of a REST operation parameter, which decides the input it is edited with.
 */
export enum RestParameterKind {
    Boolean = 'boolean',
    Integer = 'integer',
    Number = 'number',
    String = 'string',
    DateTime = 'dateTime',
    Locale = 'locale',
    Enum = 'enum',
    StringArray = 'stringArray',
    EnumArray = 'enumArray',
    LocaleArray = 'localeArray'
}

/**
 * Whether values of the kind are lists.
 */
export function isArrayRestParameterKind(kind: RestParameterKind): boolean {
    return kind === RestParameterKind.StringArray ||
        kind === RestParameterKind.EnumArray ||
        kind === RestParameterKind.LocaleArray
}
