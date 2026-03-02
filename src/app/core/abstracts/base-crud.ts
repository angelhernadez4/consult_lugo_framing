import { ActivatedRoute, Router } from "@angular/router";
import { State } from "./base-state";
import { NotificationService } from "@core/services/notification";
import { inject } from "@angular/core";
import { CrudNaming, CrudRouting } from "@core/utils";
import { BaseService } from "./base";
/**
 * Clase base abstracta para componentes que realizan operaciones CRUD (Crear, Leer, Actualizar, Eliminar).
 * * Extiende de `StateComponent` para manejar el estado reactivo y añade capacidades de enrutamiento.
 * y nomenclatura estandarizada (singular, plurar, género) para la interfaz de usuario.
 * @template T - El tipo de dato (modelo) que gestiona este CRUD.
 */
export abstract class BaseCrud<T> extends State<T> {
    protected readonly notificationService: NotificationService = inject(NotificationService)
    /**
     * Servicio de Angular para acceder a la información de la ruta activa (parámetros, data, etc.).
     */
    protected readonly route: ActivatedRoute = inject(ActivatedRoute);

    /**
     * Servicio de Angular para realizar la navegación imperativa entre vista.
     */
    protected readonly router: Router = inject(Router);
    
    /**
     * Configuración de rutas estandarizadas para el CRUD (index, create, update, detail).
     * * **Nota:** Se utiliza la aserción de asignación definitiva (`!`) porque esta propiedad
     * debe ser poblada llamando al método `initialize()`
     */
    public routes!: CrudRouting;

    /**
     * Configuración de nomenclaruta (singular, plural y género gramatical).
     * Útil para mostrar títulos dinámicos en la UI (ej: "Crear nuevo usuario" vs "Nueva tarea").
     * * **Nota:** Se puebla mediante el método `initialize()`.
     */
    public names!: CrudNaming;

    /**
     * Inicializa las propiedades de configuración del componente basándose en el servicio proporcionado.
     * * Este método conecta el componente con la lógica del `BaseService`, heredando automáticamente
     * las rutas y la gramática (pluralización y género) definida en el servicio.
     * @param service - Instancia del servicio que hereda de `BaseService` y contiene la configuración del dominio.
     */
    public initialize(service: BaseService) {
        this.routes = service.routes
        this.names = service.names
    }

    protected redirectToIndex() {
        this.router.navigateByUrl(this.routes.indexRoute)
    }
}
