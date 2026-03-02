import { CaseState, LoadingDataState, LoadingStates } from "@core/interfaces";

export interface MaterialPageState extends LoadingStates, CaseState {
    materialId?: number;
}

export interface MaterialListPageState extends LoadingDataState {}
export interface MaterialDetailState extends LoadingDataState {}