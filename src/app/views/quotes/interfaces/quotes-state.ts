import { CaseState, LoadingDataState, LoadingStates } from "@core/interfaces";

export interface QuotePageState extends LoadingStates, CaseState {
    quoteId?: number;
}

export interface QuoteListPageState extends LoadingDataState {}
export interface QuoteDetailState extends LoadingDataState {}