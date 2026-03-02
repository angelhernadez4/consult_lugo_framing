import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BaseServiceConfig, ErrorsMap } from '@core/interfaces';
import { CrudNames, CrudNaming, CrudRoutes, CrudRouting } from '@core/utils';
import { environment as ENV } from "@environments/environments";

/**
 * Servicio base del cual deben extender los servicios de dominio.
 * Centraliza la configuración de endpoints (API), rutas de frontend y nomenclatura.
 */
export class BaseService {
    protected readonly http: HttpClient = inject(HttpClient);
    /** URL completa del endpoint de la api */
    public BASE_URL: string;
    /** Objeto con las rutas de navegación precalculadas */
    public routes: CrudRouting;
    /** Objeto con la información gramatical de la entidad */
    public names: CrudNaming;

    /**
     * Configura el servicio inicializando las rutas y la gramática automáticamente.
     * @param config - Objeto de configuración con los datos de la entidad y endpoints.
     */
    constructor(config: BaseServiceConfig) {
        const { baseEndpoint, singularName, baseRoute, fatherRoute } = config;
        this.BASE_URL = `${ENV.api.url}/${baseEndpoint}`;
        this.routes = new CrudRoutes(baseRoute, fatherRoute);
        this.names = new CrudNames(singularName)
    }

    /**
     * Verifica si un elemento es nulo o si corresponde a un error de "Elemento no existente".
     * Útil para validar respuestas del backend antes de procesarlas.
     *
     * @param element - El objeto o respuesta a verificar.
     * @returns `true` si es nulo o es un error de no existencia.
     */
    public isNullOrNonExist(element: any) {
        return element === null || element === ErrorsMap.ELEMET_NOT_EXIST
    }
}
