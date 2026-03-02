export enum FormErrors {
    REQUIRED = 'required',
    PASSWORD_MIS_MATCH = 'passwordsMismatch',
    MAX_LENGTH = 'maxlength',
    NO_SPACES = 'noSpaces',
    EMAIL_INVALID = 'emailInvalid',
    AUTOCOMPLETE = 'autocomplete'
}

export const formErrorMap = {
    [FormErrors.REQUIRED]: 'El campo es obligatorio',
    [FormErrors.PASSWORD_MIS_MATCH]: 'Las contraseñas no coinciden',
    [FormErrors.MAX_LENGTH]: 'Se supera el máximo de carácteres',
    [FormErrors.NO_SPACES]: 'No se permiten espacios en este campo',
    [FormErrors.EMAIL_INVALID]: 'Correo electrónico invalido',
    [FormErrors.AUTOCOMPLETE]: 'No se ha seleccionado un elemento válido'
}