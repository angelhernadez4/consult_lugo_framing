import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { PrimeNgModule } from '@prime-ng-module';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { CurrencyPipe, NgStyle } from '@angular/common';
import { RouterLink } from "@angular/router";
import { ConsultantBase } from '@views/consultant-base/pages/consultant-base';
import { Item } from '@views/consultant-base/interfaces';
import { Material } from '@views/materials/interfaces';

@Component({
    selector: 'app-consultant-lumber',
    imports: [PrimeNgModule, ReactiveFormsModule, FormsModule, CurrencyPipe, RouterLink],
    templateUrl: './consultant-lumber.html',
    styleUrl: './consultant-lumber.scss',
})
export default class ConsultantLumber extends ConsultantBase {

    override materialType: 'lumber' | 'hardware' | 'siding' = 'lumber'
    override templatePath: string = 'assets/template/lumber/Template.xlsx';
    override templatePathWithPrices: string = 'assets/template/lumber/TemplatePrice.xlsx';
    override positionTitleTotal: number = 4
    override positionValueTotal: number = 5
    protected override titleMergeColumns: number = 5
    override estimatorCellPosition: string = 'D10'
    protected override titleMergeColumnsWithPrices: number = 6

    protected override initializeForm(): void {
        this.form = this.fb.group({
            project: ['', Validators.required],
            estimator: ['', Validators.required],
            quantity: ['', Validators.required],
            description: ['', Validators.required],
            is_custom_description: [false], // toggle entre select e input
            custom_description: [null], 
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

    protected override calculatePrice(formValue: any, material: Material): number {
        if (formValue.is_custom_description || !material) return 0;
        const quantity = Number(formValue.quantity) || 1;
        const usedLength = Number(formValue.length) || 1;
        const baseLength = (material).unit_length || 1;
        const basePrice = (material).unit_price || 0;

        // Lumber: precio por pie
        const pricePerFoot = basePrice / baseLength;
        console.log(pricePerFoot);
        
        return pricePerFoot * usedLength * quantity;
    }

    protected override createItem(formValue: any, material: Material, price: number): Item {
        const isCustom = formValue.is_custom_description;
        return {
            type: 'item',
            quantity: formValue.quantity,
            description: isCustom ? formValue.custom_description : material?.name,
            materialRef: isCustom ? isCustom : material,  // sin referencia si es manual
            length: formValue.length,
            price: isCustom ? 0 : price,  // precio en 0 si es manual
            used: formValue.used,
            annotations: formValue.annotations,
        };
    }

    protected override addItemToWorksheet(worksheet: any, rowIndex: number, item: Item, itemNumber: number, withPrices?: boolean): void {
        const EVEN_ROW_FILL = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7F7F7' } // gris muy claro
        };
        const ITEM_FONT = {
            name: 'Roboto',
            size: 14
        } as const;

        const row = worksheet.getRow(rowIndex);
        row.getCell(1).value = itemNumber;
        row.getCell(2).value = item.quantity;
        row.getCell(3).value = item.materialRef?.name || item.description;
        row.getCell(4).value = item.length
        row.getCell(5).value = item.used
        if (withPrices) {
            row.getCell(5).value = item.price
            row.getCell(6).value = item.used
        }

        // ===== Zebra striping =====
        if (itemNumber % 2 === 0) {
            const lastColumn = withPrices
                ? this.titleMergeColumnsWithPrices
                : this.titleMergeColumns;

            for (let col = 1; col <= lastColumn; col++) {
                row.getCell(col).fill = EVEN_ROW_FILL;
            }
        }

        // ===== FUENTE ROBOTO 14 (AQUÍ VA) =====
        const lastColumn = withPrices
            ? this.titleMergeColumnsWithPrices
            : this.titleMergeColumns;

        for (let col = 1; col <= lastColumn; col++) {
            row.getCell(col).font = ITEM_FONT;
        }

        // Ajustar altura de fila automáticamente basado en contenido
        const descriptionLength = (item.materialRef?.name || item.description || item.annotations || '').length;
        console.log(descriptionLength);
        
        if (descriptionLength > 45) {
            row.width = Math.min(30 + (descriptionLength / 50) * 10, 60); // Altura dinámica con máximo de 60
        } else {
            row.width = 20; // Altura por defecto
        }

        // Habilitar wrap text para la celda de descripción (columna 4 en hardware)
        const descCell = row.getCell(4);
        descCell.alignment = {
            wrapText: true,
            vertical: 'middle',
            horizontal: 'center'
        };
    }

    public titleTotals = computed(() => this.calculateTotalsByTitle());
}
