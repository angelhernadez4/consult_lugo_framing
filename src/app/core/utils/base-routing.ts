export enum FragmentsRoutes {
    CREATE = 'new',
    UPDATE = 'edit',
    DETAIL = 'detail'
}

export interface CrudRouting {
    indexRoute: string
    createRoute: string;
    updateRoute: string;
    detailRoute: string;
    fatherRoute: string;
}

/**
 * Clase utilitaria que genera automáticamente las rutas estándar de un CRUD.
 * Construye las rutas para index, create, update y detail basándose en una ruta raíz.
 */
export class CrudRoutes implements CrudRouting {
    public indexRoute: string = '';
    public createRoute: string = '';
    public updateRoute: string = '';
    public detailRoute: string = '';
    public fatherRoute: string = '';

    /**
     * 
     * @param indexRoute - La ruta principal del recurso.
     * @param father - (Opcional) Prefijo de ruta padre para recursos anidados.
     */

    constructor(indexRoute: string, father: string | undefined = undefined) {
        this.indexRoute = father ? `${father}/${indexRoute}` : indexRoute;
        this.createRoute = `${this.indexRoute}/${FragmentsRoutes.CREATE}`;
        this.updateRoute = `${this.indexRoute}/${FragmentsRoutes.UPDATE}`;
        this.detailRoute = `${this.indexRoute}/${FragmentsRoutes.DETAIL}`;
        this.fatherRoute = father ? father : '';
    }
}