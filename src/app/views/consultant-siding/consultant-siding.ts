import { CurrencyPipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { formatCurrency } from '@core/utils';
import { PrimeNgModule } from '@prime-ng-module';
import { ItemSiding } from '@views/consultant-base/interfaces';
import { ConsultantBase } from '@views/consultant-base/pages/consultant-base';
import { Material } from '@views/materials/interfaces';

@Component({
    selector: 'app-consultant-siding',
    imports: [PrimeNgModule, ReactiveFormsModule, FormsModule, RouterLink, CurrencyPipe],
    templateUrl: './consultant-siding.html',
    styleUrl: './consultant-siding.scss',
})
export default class ConsultantSiding extends ConsultantBase {
    override materialType: 'lumber' | 'hardware' | 'siding' = 'siding'
    override templatePath: string = 'assets/template/siding/Template.xlsx'
    override templatePathWithPrices: string = 'assets/template/siding/TemplatePrice.xlsx'
    override positionTitleTotal: number = 6
    override positionValueTotal: number = 7
    protected override titleMergeColumns: number = 7
    override estimatorCellPosition: string = 'F10'
    protected override titleMergeColumnsWithPrices: number = 8

    public units = [
        { name: 'EA', label: 'EA' },
        { name: 'BOX', label: 'BOX' },
        { name: 'LF', label: 'LF' },
    ];

    protected override initializeForm(): void {
        this.form = this.fb.group({
            project: ['', Validators.required],
            estimator: ['', Validators.required],
            quantity: ['', Validators.required],
            unit: ['', Validators.required],
            is_custom_description: [false], // toggle entre select e input
            custom_description: [null], 
            description: ['', Validators.required],
            length: [''],
            used: [''],
            annotations: ['']
        })

        this.form.get('is_custom_description')?.valueChanges.subscribe(isCustom => {
            const description = this.form.get('description');
            const customDescription = this.form.get('custom_description');

            if (isCustom) {
                description?.clearValidators();
                description?.setValue(null);
                customDescription?.setValidators(Validators.required);
            } else {
                customDescription?.clearValidators();
                customDescription?.setValue(null);
                description?.setValidators(Validators.required);
            }

            description?.updateValueAndValidity();
            customDescription?.updateValueAndValidity();
        });
    }

    get isCustomDescription(): boolean {
        return this.form.get('is_custom_description')?.value;
    }

    protected calculatePrice(formValue: any, material: Material): number {
        if (formValue.is_custom_description || !material) return 0;
        const quantity = formValue.quantity || 1;
        const unit = formValue.unit?.name || 'EA';
        const basePrice = material.unit_price || 0;
        const basePriceBox = material.unit_price_box || 0;        

        // Hardware: si es EA (each), multiplica precio por cantidad
        // Si es BOX, el precio es por caja
        if (unit === 'EA') {
            return basePrice * quantity;
        } else if (unit === 'BOX') {
            return basePriceBox * quantity; // Precio de la caja completa
        } else if (unit === 'LF') {
            return (quantity / 100) * basePrice
        }
        
        return basePrice * quantity;
    }

    protected override createItem(formValue: any, material: Material, price: number): ItemSiding {
        const isCustom = formValue.is_custom_description;
        return {
            type: 'item',
            quantity: formValue.quantity,
            description: isCustom ? formValue.custom_description: material.name,
            materialRef: isCustom ? isCustom : material,
            unit: formValue.unit,
            length: formValue.length,
            price: isCustom ? 0 : Number(price.toFixed(2)),
            used: formValue.used?.name ?? '',
            annotations: formValue.annotations
        };
    }

    protected override getPDFHeaders(withPrices: boolean): string[][] {
        return withPrices
            ? [['#', 'Qty', 'Unit', 'Description', 'Length', 'Price', 'Annotations']]
            : [['#', 'Qty', 'Unit', 'Description', 'Length', 'Annotations']];
    }

    protected override getPDFColumns(withPrices: boolean): number {
        return withPrices ? 7 : 6;
    }

    protected override buildPDFRow(item: ItemSiding, itemNumber: number, withPrices: boolean): any[] {
        const unit = typeof item.unit === 'string' ? item.unit : item.unit?.name || '';
        return withPrices
            ? [itemNumber, item.quantity, unit, item.materialRef?.name || item.description, item.length, formatCurrency(item.price!), item.annotations]
            : [itemNumber, item.quantity, unit, item.materialRef?.name || item.description, item.length, item.annotations];
    }

    protected override addItemToWorksheet(worksheet: any, rowIndex: number, item: ItemSiding, itemNumber: number, withPrices?: boolean): void {
        const row = worksheet.getRow(rowIndex);
        row.getCell(1).value = itemNumber;
        row.getCell(2).value = item.quantity;
        row.getCell(3).value = typeof item.unit === 'string' ? item.unit : item.unit?.name || '';
        row.getCell(4).value = item.materialRef?.name || item.description;
        row.getCell(6).value = item.length
        row.getCell(7).value = item.used

        if (withPrices) {
            row.getCell(7).value = item.price
            row.getCell(8).value = item.used
        }

        // Ajustar altura de fila automáticamente basado en contenido
        const descriptionLength = (item.materialRef?.name || item.description || '').length;
        if (descriptionLength > 50) {
            row.height = Math.min(30 + (descriptionLength / 50) * 10, 60); // Altura dinámica con máximo de 60
        } else {
            row.height = 20; // Altura por defecto
        }

        // Habilitar wrap text para la celda de descripción (columna 4 en hardware)
        const descCell = row.getCell(4);
        descCell.alignment = {
            wrapText: true,
            vertical: 'middle',
            horizontal: 'center'
        };
    }
}
