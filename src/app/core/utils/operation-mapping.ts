import { Gender } from "@core/i18n";
import { OperationCases } from "@core/interfaces";

export const pastOperation: Record<OperationCases, Record<Gender, string>> = {
    [OperationCases.CREATE]: {
        [Gender.MALE]: 'created',
        [Gender.FEMALE]: 'created'
    },
    [OperationCases.UPDATE]: {
        [Gender.MALE]: 'updated',
        [Gender.FEMALE]: 'updated'
    }
}

export const operationInfinitive: Record<OperationCases, string> = {
    [OperationCases.CREATE]: 'create',
    [OperationCases.UPDATE]: 'update'
}

export const operationLabel: Record<OperationCases, Record<Gender, string>> = {
    [OperationCases.CREATE] : {
        [Gender.MALE]: 'new',
        [Gender.FEMALE]: 'new'
    },
    [OperationCases.UPDATE]: {
        [Gender.MALE]: 'update',
        [Gender.FEMALE]: 'update'
    }
}