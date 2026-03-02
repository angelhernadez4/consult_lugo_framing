import { WritableSignal } from "@angular/core"
/**
 * Clase abstracta diseñada para facilitar la gestión de estado local en componentes de Angular
 * @abstract
 * @template T - Defide la estructura (interfaz o tipo) del objeto de estado que manejará el componente
 * @example
 * interface UserState { name: string; }
 * class UserComponent extends StateComponent<UserState> { ... }
 */
export abstract class State<T> {
     /**
     * La señal (Signal) que almacena el estado actual del componente.
     * Al ser abstracta, obliga a las clases hijas a inicializarla.
     * @protected
     * @abstract
     * @type {WritableSignal<T>}
     */
    protected abstract state: WritableSignal<T>

    /**
     * Actualiza el estado de manera parcial e inmutable.
     * Toma las propiedades proporcionadas en 'partialState' y las fusiona con el estado actual
     * utilizando el operador spread (...), asegurando que no se pierdan las propiedades no mencionadas
     * @protected
     * @param {Partial<T>} partialState - Un objeto que contiene subconjunto de propiedades de T que se desean actualizar.
     * @returns
     */
    protected updateState(partialState: Partial<T>) {
        this.state.update((currentState) => ({ ...currentState, ...partialState }))
    }
}
