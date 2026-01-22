import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { ToastModule } from 'primeng/toast'
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { ButtonModule } from "primeng/button";
import { FloatLabelModule } from 'primeng/floatlabel'
import { MessageModule } from 'primeng/message';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        CardModule,
        ButtonModule,
        FloatLabelModule,
        MessageModule,
        InputTextModule,
        AutoCompleteModule,
        SelectModule,
        InputNumberModule,
        DividerModule,
        TableModule,
        DialogModule
    ],
    exports: [
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        CardModule,
        ButtonModule,
        FloatLabelModule,
        MessageModule,
        InputTextModule,
        AutoCompleteModule,
        SelectModule,
        InputNumberModule,
        DividerModule,
        TableModule,
        DialogModule
    ]
})
export class PrimeNgModule { }