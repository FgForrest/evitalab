/**
 * Why a parameter value cannot be sent.
 */
export enum RestParameterValidationFailure {
    Missing = 'missing',
    NotBoolean = 'notBoolean',
    NotInteger = 'notInteger',
    NotNumber = 'notNumber',
    NotDateTime = 'notDateTime',
    NotAllowedValue = 'notAllowedValue'
}
