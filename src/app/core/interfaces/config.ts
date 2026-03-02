import { BackEndModuleNames } from "./backend";

/**
 * Configuración necesaria para instanciar un `BaseSerice`.
 */
export interface BaseServiceConfig {
    /** Ruta base para la navegación en el frontend (ej: 'users')  */
    baseRoute: string;
    /** Nombre en singular de la entidad (ej: 'Usuario). Se usa para generar títulos y mensajes. */
    singularName: string;
    /** Endpoint base de la api (ej: 'users') */
    baseEndpoint: string;
    /** (Opcional) Ruta padre si este recurso es anidado */
    fatherRoute?: string;
    /** Módulo del backend asociado, útil para logs o configuración de microservicios */
    // backendModule: BackEndModuleNames
}