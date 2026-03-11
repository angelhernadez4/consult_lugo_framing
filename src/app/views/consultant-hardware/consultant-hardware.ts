import { CurrencyPipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PrimeNgModule } from '@prime-ng-module';
import { ItemHardware } from '@views/consultant-base/interfaces';
import { Material } from '@views/materials/interfaces';
import { ConsultantBase } from '@views/consultant-base/pages/consultant-base';
import { formatCurrency } from '@core/utils/format';

@Component({
    selector: 'app-consultant-hardware',
    imports: [PrimeNgModule, ReactiveFormsModule, FormsModule, CurrencyPipe, RouterLink],
    standalone: true,
    templateUrl: './consultant-hardware.html',
    styleUrl: './consultant-hardware.scss',
})
export default class ConsultantHardware extends ConsultantBase {
    materialType: 'lumber' | 'hardware' | 'siding' = 'hardware';
    override templatePath: string = 'assets/template/hardware/Template.xlsx';
    override templatePathWithPrices: string = 'assets/template/hardware/TemplatePrice.xlsx';
    override positionTitleTotal: number = 6;
    override positionValueTotal: number = 7;
    protected override titleMergeColumns = 7;
    override estimatorCellPosition: string = 'F10'
    override titleMergeColumnsWithPrices: number = 8
    public units = [
        { name: 'EA', label: 'EA' },
        { name: 'BOX', label: 'BOX' },
        { name: 'LF', label: 'LF' },
        { name: 'SF', label: 'SF' },
    ];

    protected initializeForm(): void {
        this.form = this.fb.group({
        project: ['', Validators.required],
        estimator: ['', Validators.required],
        quantity: ['', Validators.required],
        description: ['', Validators.required],
        is_custom_description: [false], // toggle entre select e input
        custom_description: [null],
        unit: ['', Validators.required],  
        size: [''],                       
        annotations: ['']
        });
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
        const quantity = formValue.quantity ?? 1;
        const unit = formValue.unit?.name ?? 'EA';
        const basePrice = material.unit_price ?? 0;
        const basePriceBox = material.unit_price_box ?? 0;
        const length = material.unit_length ?? 0    
        const area = material.unit_area_sf ?? 0  

        // Hardware: si es EA (each), multiplica precio por cantidad
        // Si es BOX, el precio es por caja
        switch (unit) {
            case 'EA':
                return basePrice * quantity;
                break;
            case 'BOX':
                return basePriceBox * quantity;
                break;
            case 'LF':
                return (quantity / length) * basePrice;
                break;
            case 'SF':
                return (quantity / area) * basePrice;
                break;
            default :
                return 0;
        }
    }

    protected createItem(formValue: any, material: Material, price: number): ItemHardware {
        const isCustom = formValue.is_custom_description;
        return {
            type: 'item',
            quantity: formValue.quantity,
            description: isCustom ? formValue.custom_description : material.name,
            materialRef: isCustom ? isCustom : material,
            unit: formValue.unit,
            price: isCustom ? 0 : Number(price.toFixed(2)),
            used: formValue.used?.name ?? '',
            annotations: formValue.annotations
        };
    }

    protected override getPDFHeaders(withPrices: boolean): string[][] {
        return withPrices
            ? [['#', 'Qty', 'Unit', 'Description', 'Price', 'Annotations']]
            : [['#', 'Qty', 'Unit', 'Description', 'Annotations']];
    }

    protected override getPDFColumns(withPrices: boolean): number {
        return withPrices ? 6 : 5;
    }

    protected override buildPDFRow(item: ItemHardware, itemNumber: number, withPrices: boolean): any[] {
        const unit = typeof item.unit === 'string' ? item.unit : item.unit?.name || '';
        return withPrices
            ? [itemNumber, item.quantity, unit, item.materialRef?.name || item.description, formatCurrency(item.price!), item.annotations]
            : [itemNumber, item.quantity, unit, item.materialRef?.name || item.description, item.annotations];
    }

    // Sobrescribir método para agregar columnas adicionales al Excel
    protected override addItemToWorksheet(worksheet: any, rowIndex: number, item: ItemHardware, itemNumber: number, withPrices: boolean = true): void {
        const row = worksheet.getRow(rowIndex);
        row.getCell(1).value = itemNumber;
        row.getCell(2).value = item.quantity;
        row.getCell(3).value = typeof item.unit === 'string' ? item.unit : item.unit?.name || '';
        row.getCell(4).value = item.materialRef?.name || item.description;
        row.getCell(6).value = item.size;   // Columna Size
        row.getCell(7).value = item.annotations;

        if (withPrices) {
            row.getCell(7).value = item.price
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
