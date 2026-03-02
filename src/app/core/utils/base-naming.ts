import { Gender, getGender, pluralize } from "@core/i18n";

export interface CrudNaming {
    singularName: string;
    pluralName: string;
    gender: Gender;
}

/**
 * Clase utilitaria que calcula y almacena las variantes gramaticales del nombre de la entidad.
 * Genera automáticamente el plural y detecta el género.
 */
export class CrudNames implements CrudNaming {
    singularName: string;
    pluralName: string;
    gender: Gender;

    /**
     * 
     * @param singularName - El nombre de la entidad en singular (ej: "Solicitud").
     * Automáticamente calculará:
     * - `pluralName`: "Solicitudes"
     * - `gender`: Gender.FEMALE
     */
    constructor(singularName: string) {
        this.singularName = singularName;
        this.pluralName = pluralize(singularName)
        this.gender = getGender(singularName)!
    }
}