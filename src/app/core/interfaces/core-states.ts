export enum OperationCases {
    CREATE = 'create',
    UPDATE = 'update'
}
export interface OperationalState extends CaseState, LoadingDataState, LoadingSubmitState {}

export interface CaseState {
    case: OperationCases
}

export interface LoadingStates extends LoadingSubmitState, LoadingDataState {}

export interface LoadingDataState {
    loadingData: boolean;
}

export interface LoadingSubmitState {
    loadingSubmit: boolean;
}