import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-main-button',
    standalone: false,
    templateUrl: './main-button.html',
    styleUrl: './main-button.scss',
})
export class MainButton {
    public onClick = output();

    public loading = input.required<boolean>();

    public icon = input<string>('');
    public label = input<string>('Enviar');
    public loadingLabel = input<string>();
    public disabled = input<boolean>(false)
    public severity = input<
        | 'success'
        | 'info'
        | 'danger'
        | 'help'
        | 'primary'
        | 'secondary'
        | 'contrast'
        | null
        | undefined
    >('primary');

    public click() {
        this.onClick.emit()
    }
}
