import { FormBuilder, FormControl } from "@angular/forms";
import { BaseCrud } from "./base-crud";
import { GetAllObs } from "@core/interfaces";
import { inject, WritableSignal } from "@angular/core";
import { tap } from "rxjs";
/**
 * Clase base abstracta diseñada para componentes cuya función es mostrar reportes
 * o datos de solo lectura, a menudo involucrando formularios de filtrado
 * y la carga de múltiples listas de información auxiliar.
 * Extiende de `BaseCrudComponent` para heredar las funcionalidades base (rutas, nomenclatura).
 * Introduce utilidades para la gestión de formularios reactivos y la carga segura de listas.
 * @template T - El tipo de dato principal que el componente maneja o reporta.
 */
export abstract class Report<T> extends BaseCrud<T> {
    /**
     * Inyección del servicio `FormBuilder` para facilitar la creación de `FormGroup` y `FormControl`.
     * @protected
     */
    protected readonly fb: FormBuilder = inject(FormBuilder)

    /**
     * Carga una lista de elementos auxiliares (ej: opciones de un dropdown)
     * con un Signal de escritura, habilitando/deshabilitando un control de formulario asociado.
     * Este método es ideal par poblar datos de un formulario de filtrado.
     * 
     * @protected
     * @param fieldControl - El control de formulario (`FormControl`) asociadoa a esta lista (se deshabilita durante la carga).
     * @param getObs - El Observable que realiza la llamada API para obtener la lista.
     * @param elementSignal - La signal donde se almacenarán los elementos cargados.
     * @param listName - Nombre legible de la lista para notificaciones de error (ej: 'tipos de usuario')
     * @returns El observable original con la lógica de tap aplicada.
     */
    protected setFieldInfo<P>(
        fieldControl: FormControl,
        getObs: GetAllObs<P>,
        elementSignal: WritableSignal<P[]>,
        listName: string
    ) : GetAllObs<P> {
        fieldControl.disable()

        return getObs.pipe(
            tap((elements) => {
                if (elements === null) {
                    this.handleNecessaryInfoError(listName)
                    return
                }

                elementSignal.set(elements)
                fieldControl.enable()
            })
        )
    }

    /**
     * Carga una lista de elementos de solo lectura y sincroniza el resultado con un Signal de escritura.
     * 
     * Este método es ideal para poblar datos para una tabla o una lista de visualización simple
     * 
     * @param getObs - El observable que realiza la llamada API para obtener la lista.
     * @param elementSignal - La signal donde se almacenarán los elementos cargados.
     * @param listName - Nombre legible de la lista para notificaciones de error
     * @returns El observable original con la lógica de tap aplicada.
     */
    protected setShowInfo<P>( getObs: GetAllObs<P>, elementSignal: WritableSignal<P[]>, listName: string ) : GetAllObs<P> {
        return getObs.pipe(
            tap((elements) => {
                if (elements === null) {
                    this.handleNecessaryInfoError(listName)
                    return
                }

                elementSignal.set(elements)
            })
        )
    }

    /**
     * Maneja el error cuando la carga de una lista específica (ej: dropdown, tabla) devuelve un valor nulo.
     * Muestra una notificación de error con el nombre de la lista fallida y redirige a la ruta raíz (`/`).
     * @param listName - El nombre legible de la lista que no se pudo cargar.
     */
    protected handleNecessaryInfoError(listName: string) {
        this.notificationService.error(`cargar información de ${listName}`)
        this.router.navigateByUrl('/')
    }
}
