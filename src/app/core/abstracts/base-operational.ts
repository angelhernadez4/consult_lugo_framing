import { formErrorMap, FormErrors, GetAllObs, OperationalState, OperationCases } from "@core/interfaces";
import { Read } from "./base-read";
import { map, of, switchMap, tap } from "rxjs";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { computed, inject, Signal, WritableSignal } from "@angular/core";
import { operationInfinitive, operationLabel, pastOperation } from "@core/utils";
/**
 * Clase base abstracta diseñada para componentes que manejan **formularios**
 * y ejecutan una **operación de escritura** (Crear o Actualizar) sobre una entidad.
 * 
 * Extiende de `ReadComponent` para heredar la lógica de extracción y validación del ID.
 * Centraliza la lógica de determinación del caso (CREATE/UPDATE), la validación de formularios
 * y la gestión de errores de la operación final.
 * @template - T La interfaz de estado que debe extender de `OperationalState` (incluye la propiedad `case, loadingData, loadingSubmit`).
 */
export abstract class Operational<T extends OperationalState> extends Read<T>  {
    /**
     * Inyección del servicio `FormBuilder` para la gestión de formularios reactivos.
     * @protected
     */
    protected readonly fb: FormBuilder = inject(FormBuilder)

    /**
     * El `FormGroup` principal que contiene todos los controles de la vista.
     * Debe ser inicializado en la clase hija.
     * @public
     * @abstract
     */
    public abstract form: FormGroup

    /**
     * Señal computada para generar el texto del título principal del componente (header).
     * El texto se construye basado en la operación actual (ej: "Crear Usuario" o "Actualizar Usuario").
     *
     * @returns La etiqueta del encabezado con la primera letra en mayúscula.
     */
    public readonly headerLabel: Signal<string> = computed(() => {
        const label: string = `${operationLabel[this.state().case][this.names.gender]} ${this.names.singularName}`
        return label.charAt(0).toUpperCase() + label.slice(1)
    })

    /**
     * Señal computada para generar el texto del botón principal de envío (submit).
     * Utiliza la forma infinitiva del verbo de la operación (ej: "Crear" o "Actualizar").
     *
     * @returns La etiqueta del botón con la primera letra en mayúscula.
     */
    public readonly submitLabel: Signal<string> = computed(() => `${operationInfinitive[this.state().case].charAt(0).toUpperCase()}${operationInfinitive[this.state().case].slice(1).toLowerCase()}`)

    /**
     * Obtiene el mensaje de error legible del control de formulario especificado.
     *
     * Verifica si el control ha sido tocado (`touched`) y no está prístino (`pristine`) antes de devolver el error,
     * utilizando un mapa de errores (`formErrorMap`) para la traducción.
     *
     * @param controlName - El nombre del control de formulario a revisar.
     * @param form - (Opcional) El `FormGroup` a utilizar; por defecto usa `this.form`.
     * @returns El mensaje de error traducido o `undefined` si el control es válido o no ha sido interactuado.
     */
    public getControlErrors(controlName: string, form?: FormGroup) {
        const currentForm = form ? form : this.form

        const touched = currentForm.controls[controlName].touched
        const pristine = currentForm.controls[controlName].pristine
        const errorsRaw = currentForm.controls[controlName].errors as {}

        if (errorsRaw === null || pristine || !touched) return undefined

        const errors = Object.keys(errorsRaw) as FormErrors[]
        return formErrorMap[errors[0]]
    }

    /**
     * Verifica si el formulario es inválido. Si lo es, muestra una notificación de advertencia.
     * @protected
     * @returns `true` si el formulario es inválido (y muestra la advertencia), `false` si es válido.
     */
    protected isInvalidForm() {
        if (this.form.invalid) return this.notificationService.warn('Faltan campos por completar')
        return this.form.invalid
    }

    /**
     * Determina el caso de operación (CREATE o UPDATE) basándose en la URL actual.
     *
     * Se suscribe a la URL para:
     * 1. Detectar si el path es 'new' (CREATE) o un ID (UPDATE).
     * 2. Actualizar la propiedad `case` en el estado.
     * 3. Si es UPDATE, llama a `readId` para iniciar la carga de los datos existentes.
     *
     * @protected
     * @param getElementById - Callback para iniciar la obtención de datos si el caso es UPDATE.
     */
    protected setCase(getElementById: (id: number) => void) {
        const caseSub = this.route.url.pipe(
            tap(() => this.updateState({ loadingData: true } as Partial<T>)),
            map((url) : OperationCases => {
                const caseState: OperationCases = url[0].path === 'new' ? OperationCases.CREATE : OperationCases.UPDATE

                this.updateState({ case: caseState } as Partial<T>)
                if (caseState === OperationCases.CREATE) {
                    this.updateState({ loadingData: false } as Partial<T>)
                }
                return caseState
            })  ,
            switchMap((caseState) => caseState === OperationCases.UPDATE ? this.readId((id) => getElementById(id)) : of(null))
        ).subscribe()
        this.subs.push(caseSub)
    }

    /**
     * Maneja la respuesta final de la operación de escritura (creación o actualización).
     *
     * 1. Desactiva el estado de carga (`loadingSubmit`).
     * 2. Si es exitosa, muestra un mensaje de éxito con el verbo en pasado y redirige al índice.
     * 3. Si falla, muestra un mensaje de error con el verbo en infinitivo.
     *
     * @protected
     * @param success - Indica si la operación API fue exitosa (`true`) o fallida (`false`).
     */
    protected handleOperationRes(success: boolean) {
        this.updateState({ loadingSubmit: false } as Partial<T>)
        const operation: string = success ? pastOperation[this.state().case][this.names.gender] : operationInfinitive[this.state().case]

        if (!success) {
            this.notificationService.error(`${operation} ${this.names.singularName}`)
            return
        }

        this.notificationService.success(`${this.names.singularName} ${operation}`)
        this.redirectToIndex()
    }

    /**
     * Carga una lista de elementos auxiliares (ej: opciones de un dropdown) y sincroniza el resultado
     * con una Signal, deshabilitando/habilitando el control asociado al formulario.
     *
     * Este método es una versión simplificada de `setFieldInfo` de `ReportComponent`.
     *
     * @protected
     * @template P - Tipo de dato de los elementos que se están cargando en la lista.
     * @param fieldControl - El control de formulario (`FormControl`) asociado a esta lista (se deshabilita durante la carga).
     * @param getObs - El Observable que realiza la llamada API.
     * @param elementSignal - La Signal donde se almacenarán los elementos cargados.
     * @returns El Observable original con la lógica de tap aplicada.
     */
    protected setFieldInfo<P>(
        fieldControl: FormControl,
        getObs: GetAllObs<P>,
        elementSignal: WritableSignal<P[]>,
    ) : GetAllObs<P> {
        fieldControl.disable()

        return getObs.pipe(
            tap((elements) => {
                if (elements === null) {
                    this.handleNecessaryInfoError()
                    return
                }

                elementSignal.set(elements)
                fieldControl.enable()
            })
        )
    }
}
