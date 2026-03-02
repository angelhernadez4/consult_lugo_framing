import { computed, Signal } from "@angular/core";
import { BaseCrud } from "./base-crud";
import { map, Subscription } from "rxjs";
import { ErrorsMap } from "@core/interfaces";
/**
 * Clase base abstracta diseñada para componentes que tienen como objetivo principal.
 * **leer (mostrar el detalle)** de una única entidad.
 * 
 * Extiende de `BaseCrudComponent` para heredar la gestión de estado, rutas y nomenclatura.
 * Introduce lógica específica para la extracción y validación del ID de la ruta.
 * @template T - El tipo de dato (modelo) de la entidad que se va a leer.
 */
export abstract class Read<T> extends BaseCrud<T> {
    /**
     * Señal computada utilizada para generar el título de la página de detalle de forma dinámica.
     * 
     * El valor se calcula usando el nombre singular de la entidad (ej: 'Detalle de Usuario').
     */
    public detailLabel: Signal<string> = computed( () => `Detail of ${this.names.singularName}` )

    /**
     * Array para almacenar las suscripciones de RxJS y facilitar su desuscripción (unsubscribe)
     * al destruir el componente, previniendo fugas de memoria
     */
    protected subs: Subscription[] = []

    /**
     * Observador que se suscribe a los paramámetros de la ruta para extraer el ID del elemento a leer.
     * Si el ID no es un número válido (`NAN`), manejra el error y redirige.
     * Si es válido, llama a la función de obtención de datos proporcionada.
     * @protected
     * @param getElementById - Callback que debe ser implementado en la clase hija para iniciar la carga del elemento.
     * @returns Un Observable que emite cuando el ID es procesado.
     * @example
     * this.readId((id) => this.service.getById(id).subscribe())
     */
    protected readId(getElementById: (id: number) => void) {
        return this.route.params.pipe(
            map((params) => {
                const id = Number(params['id']);

                if (isNaN(id)) {
                    this.handleNaNIdError();
                    return;
                }
                getElementById(id)
            })
        )
    }

    /**
     * Maneja un error genérico cuando falta información crítica para cargar la vista.
     * Muestra una notificación de error y redirige a la vista de índice (lista).
     * @protected
     */
    protected handleNecessaryInfoError() {
        this.notificationService.error('Load the necessary information')
        this.redirectToIndex()
    }

    /**
     * Verifica si el elemento devuelto por el servicio (generalmente una llamada `getById`)
     * contiene un error conocido (nulo o elemento no existe)
     * Si detecta un error, ejecuta el manejador de errores correspondientes (`handleGetError` o `handleNonExistError`)
     * y retorna `true`
     * @protected
     * @param element - El elemento obtenido de la API (puede ser el modelo T, null o unerror de `ErrorsMap`)/
     * @returns `true` si detecta un error, `false` en caso contrario.
     */
    protected hasGetError(element: any) {
        if (element === null) {
            this.handleGetError()
            return true
        }        
        if (element === ErrorsMap.ELEMET_NOT_EXIST) {
            this.handleNonExistError()
            return true
        }
        return false
    }

    /**
     * Maneja el error cuando el parámetro 'id' de la ruta no es un valor numérico válido.
     * Muestra una notificación específica y redirige a la vista de índice.
     * @protected
     */
    protected handleNaNIdError() {
        this.notificationService.error('The provided ID is not a valid number', false)
        this.redirectToIndex()
    }

    /**
     * Maneja el error cuando el servidor responde que el elemento solicitado no existe.
     * Muestra una notificación con el nombre singular de la entidad y redirige a la vista de índice.
     * @private
     */
    private handleNonExistError() {
        this.notificationService.error(`The requested ${this.names.singularName} does not exist`, false)
        this.redirectToIndex()
    }

    /**
     * Maneja un error genérico durante la solicitud de obtención de la información (ej: error 500).
     * Muestra una notificación y redirige a la vista de índice.
     * @private
     */
    private handleGetError() {
        this.notificationService.error(`Get information of ${this.names.singularName}`)
        this.redirectToIndex()
    }

}
