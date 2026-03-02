import { inject, Injectable } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private readonly messageService: MessageService = inject(MessageService)
    private readonly confirmationService: ConfirmationService = inject(ConfirmationService)

    public clearToasts(): void {
        this.messageService.clear();
    }

    public success(success: string, autoComplete: boolean = true) {
        const message = autoComplete ? `${success} with success` : success
        const messageCap = message.charAt(0).toUpperCase() + message.slice(1)
        this.showToast(messageCap, 'success')
    }

    public warn(message: string) {
        this.showToast(message, 'warn')
    }

    public error(error: string, autoComplete: boolean = true) {
        const message: string = autoComplete ? `Error retrieving ${error}` : error
        this.showToast(message, 'error')
    }

    public info(message: string) {
        this.showToast(message, 'info')
    }

    public startSession() {
        this.showToast('Sesión iniciada con éxito', 'success' ,1500)
    }

    public showConfirm(config: { message: string, title?: string, canClose?: boolean }, acceptFn: Function, rejectFn?: Function) {
        const { message, title } = config
        this.confirmationService.confirm({
            header: title ?? 'Confirm',
            message,
            rejectButtonStyleClass: 'p-button-text',
            acceptIcon: 'none',
            rejectIcon: 'none',
            acceptLabel: 'Yes',
            closeOnEscape: config.canClose ?? true,
            dismissableMask: config.canClose ?? true,
            accept: acceptFn,
            reject: rejectFn,
        })
    }

    public showToast(detail: string, severity: 'success' | 'info' | 'warn' | 'error', life: number = 3000) {
        this.messageService.add({
            summary: this.getSummary(severity),
            detail,
            severity,
            life
        })
    }

    private getSummary(severity: string) {
        switch (severity) {
            case 'success': return 'Success';
            case 'info': return 'Information';
            case 'warn': return 'Warning';
            case 'error': return 'Error';
            default: return ''
        }
    }
}
