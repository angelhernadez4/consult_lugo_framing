import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { PrimeNgModule } from '@prime-ng-module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { LumberService } from '../services/lumber';
import { Item, Lumber } from '../interfaces/lumber';
import { CurrencyPipe } from '@angular/common';
import { NotificationService } from '@core/services/notification';
import * as ExcelJS from 'exceljs';

@Component({
    selector: 'app-consultant-lumber',
    imports: [PrimeNgModule, ReactiveFormsModule, FormsModule, CurrencyPipe],
    templateUrl: './consultant-lumber.html',
    styleUrl: './consultant-lumber.scss',
})
export default class ConsultantLumber implements OnInit {
    private readonly fb: FormBuilder = inject(FormBuilder)
    private readonly lumberService: LumberService = inject(LumberService)
    private readonly notificationService: NotificationService = inject(NotificationService)

    public loadingData: WritableSignal<boolean> = signal(false)
    public loadingExport: WritableSignal<boolean> = signal(false)
    public visibleDialog: WritableSignal<boolean> = signal(false)
    public estimator: any[] = []
    public used: WritableSignal<any[]> = signal([])
    public data: WritableSignal<Lumber[]> = signal([])
    public items: WritableSignal<Item[]> = signal([])
    public itemCounter: WritableSignal<number> = signal(1);

    public formTitle: FormGroup = this.fb.group({
        title: ['', Validators.required]
    })

    public form: FormGroup = this.fb.group({
        project: ['', Validators.required],
        estimator: ['', Validators.required],
        quantity: ['', Validators.required],
        description: ['', Validators.required],
        length: ['', Validators.required],
        used: ['', Validators.required],
        annotations: ['']
    })

    ngOnInit(): void {
        this.items.set([]);
        this.estimator = [
            { name: 'Jonathan Lugo' },
            { name: 'Odilon Lugo' },
            { name: 'Oscar Muñoz' }
        ]
        this.used.set([
            { name: 'Plate' },
            { name: 'Facia' },
            { name: 'Studs' },
            { name: 'Walls' },
            { name: 'Resawn' },
            { name: 'Wall shear' },
            { name: 'Gable' },
            { name: 'Headers' },
            { name: 'Bracing' },
            { name: 'Blocking' },
            { name: 'Pop outs' },
            { name: 'Post' },
            { name: 'Bracing & Blocking' },
            { name: 'Rafters' },
            { name: 'Beams' },
            { name: 'Corner post' },
            { name: 'Int doors' },
            { name: 'Floor girders' },
            { name: 'Entry studs' },
            { name: 'Rake wall studs' },
            { name: 'Ext windows' },
            { name: 'Lobby' },
            { name: 'Siding' },
            { name: 'Stringers' },
            { name: 'Entry' },
            { name: 'Trim' },
            { name: 'Landing & treads' },
            { name: 'Landing' },
            { name: 'Risers' },
            { name: 'Windows' },
            { name: 'Porch' },
            { name: 'Soffit' },
            { name: 'Doors' },
            { name: 'Upper roof' },
            { name: 'Rat run' },
            { name: 'Truss' },
            { name: 'Temp truss brace' },
            { name: 'Riggers' },
            { name: 'Post & blocking' },
            { name: 'Top plate ledger & blocking' },
            { name: 'Riggers & blocking' },
        ])
        this.getData()
    }

    public get subtotal(): number {
        return this.items()
            .filter(item => item.type === 'item')
            .reduce((sum, item) => sum + (item.price ?? 0), 0);
    }

    public get taxes(): number {
        return this.subtotal * 0.08256; // 8.256%
    }

    public get profit(): number {
        return (this.subtotal + this.taxes) * 0.15; // 15%
    }

    public get total(): number {
        return this.subtotal + this.taxes + this.profit;
    }

    public addItem() {
        if (this.form.invalid) return;
        const formValue = this.form.getRawValue();

        const basequantity = formValue.quantity;
        const selectedMaterial = formValue.description;

        // largo base y precio base del Sheet
        const baseLength = selectedMaterial.length;
        const basePrice = selectedMaterial.price;

        // pies que el usuario escribió
        const usedLength = formValue.length;

        // cálculo clave
        const pricePerFoot = basePrice / baseLength;
        const finalPrice = pricePerFoot * usedLength * basequantity;

        const currentItem = this.itemCounter();

        this.items.update(items => [
            ...items,
            {
                type: 'item',
                item: currentItem,
                quantity: formValue.quantity,
                description: selectedMaterial.material,
                materialRef: selectedMaterial,
                length: usedLength,
                price: Number(finalPrice.toFixed(2)),
                used: formValue.used?.name ?? '',
                annotations: formValue.annotations
            }
        ]);

        this.itemCounter.set(currentItem + 1);

        this.resetFormKeepProject();
    }

    public openDialog() {
        this.visibleDialog.set(true)
    }

    public closeDialog() {
        this.visibleDialog.set(false)
    }

    addTitle() {
        const title = this.formTitle.get('title')?.value;
        this.items.update(items => [
            ...items,
            {
                type: 'title',
                title
            }
        ])
        this.formTitle.reset();
        this.closeDialog();
    }

    public getData() {
        this.loadingData.set(true)
        this.lumberService.getAll().subscribe(res => {
            this.data.set(res)
            this.loadingData.set(false)
        });
    }

    public onRowSave(row: Item) {
        if (row.type === 'title') return;

        const material = row.materialRef;

        if (!material) return;

        const baseLength = material.length;
        const basePrice = material.price;

        const pricePerFoot = basePrice / baseLength;
        const finalPrice = pricePerFoot * (row.length ?? 0) * (row.quantity ?? 1);

        this.items.update(items =>
            items.map(item =>
                item.type === 'item' && item.item === row.item
                    ? {
                        ...item,
                        quantity: row.quantity,
                        length: row.length,
                        materialRef: row.materialRef,
                        used: row.used,
                        annotations: row.annotations,
                        price: Number(finalPrice.toFixed(2))
                    }
                    : item
            )
        );
    }

    public onRowDelete(item: Item) {
        this.items.update(items => items.filter(i => i.item !== item.item));
        this.reindexItems();
    }

    reindexItems() {
        const currentItems = this.items();

        if (!currentItems || currentItems.length === 0) return;

        let counter = 1;

        this.items.update(items =>
            items.map(item => {
                if (item.type === 'item') {
                    return {
                        ...item,
                        item: counter++
                    };
                }
                return item; // titles no se numeran
            })
        );

        this.itemCounter.set(counter);
    }


    public resetFormKeepProject() {
        const project = this.form.get('project')?.value;
        const estimator = this.form.get('estimator')?.value;

        this.form.reset({
            project,
            estimator
        });
        this.notificationService.success('Description added correctly', false);
    }

    // public async exportToExcel() {
    //     try {
    //         this.loadingExport.set(true)
    //         const response = await fetch('assets/template/Template.xlsx');
    //         const arrayBuffer = await response.arrayBuffer();

    //         // Leer el workbook del template
    //         const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });

    //         // Obtener la primera hoja (o la hoja que necesites)
    //         const wsName = wb.SheetNames[0];
    //         const ws = wb.Sheets[wsName];

    //         // Array para guardar los merges adicionales
    //         const existingMerges = ws['!merges'] || [];

    //         //Agregar nombre del proyecto, fecha, estimator
    //         let rowIndex = 14;

    //         this.items().forEach(item => {
    //             if (item.type === 'title') {
    //                 // Si es un título, ponerlo en la columna A con merge y estilo
    //                 ws[`A${rowIndex}`] = { 
    //                     v: item.title, 
    //                     t: 's',
    //                     s: {
    //                         font: { bold: true, sz: 14 },
    //                         fill: { fgColor: { rgb: "D3D3D3" } },
    //                         alignment: { horizontal: 'center', vertical: 'center' }
    //                     }
    //                 };

    //                 // Agregar celdas vacías para el merge
    //                 ws[`B${rowIndex}`] = { v: '', t: 's' };
    //                 ws[`C${rowIndex}`] = { v: '', t: 's' };
    //                 ws[`D${rowIndex}`] = { v: '', t: 's' };
    //                 ws[`E${rowIndex}`] = { v: '', t: 's' };
    //                 ws[`F${rowIndex}`] = { v: '', t: 's' };

    //                 // Agregar el merge desde A hasta F
    //                 existingMerges.push({
    //                     s: { r: rowIndex - 1, c: 0 },
    //                     e: { r: rowIndex - 1, c: 5 }
    //                 });

    //                 rowIndex++;
    //             } else if (item.type === 'item') {
    //                 // Agregar los datos del item
    //                 ws[`A${rowIndex}`] = { v: item.item, t: 'n' };
    //                 ws[`B${rowIndex}`] = { v: item.quantity, t: 'n' };
    //                 ws[`C${rowIndex}`] = { v: item.materialRef?.material || item.description, t: 's' };
    //                 ws[`E${rowIndex}`] = { v: item.length, t: 'n' };
    //                 ws[`F${rowIndex}`] = { v: item.used, t: 's' };
    //                 ws[`G${rowIndex}`] = { v: item.annotations || '', t: 's' };
    //                 ws[`H${rowIndex}`] = { v: item.price, t: 'n', s: { numFmt: '$#,##0.00' } };
    //                 rowIndex++;
    //             }
    //         });

    //         ws['!merges'] = existingMerges;

    //         // Obtener el nombre del proyecto o usar un nombre por defecto
    //         const projectName = this.form.get('project')?.value || 'lumber_estimate';
    //         const fileName = `${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    //         // Descargar el archivo
    //         XLSX.writeFile(wb, fileName);
    //     } catch (error) {
    //         console.error(error)
    //         this.notificationService.error('Error exporting file', false);
    //     } finally {
    //         this.loadingExport.set(false)
    //         this.notificationService.success('Excel file exported successfully', false);
    //     }
    // }

    // public async exportToExcel() {
    //     try {
    //         this.loadingExport.set(true);

    //         // Cargar el template
    //         const response = await fetch('assets/template/Template.xlsx');
    //         const arrayBuffer = await response.arrayBuffer();

    //         // Crear workbook con ExcelJS
    //         const workbook = new ExcelJS.Workbook();
    //         await workbook.xlsx.load(arrayBuffer);

    //         // Obtener la primera hoja
    //         const worksheet = workbook.getWorksheet(1); // o por nombre: workbook.getWorksheet('Nombre')

    //         if (!worksheet) {
    //             throw new Error('Worksheet not found');
    //         }

    //         // Agregar datos desde la fila 14
    //         let rowIndex = 14;

    //         this.items().forEach(item => {
    //             if (item.type === 'title') {
    //                 const row = worksheet.getRow(rowIndex);

    //                 // Agregar el título en la celda A
    //                 const cellA = row.getCell(1); // Columna A
    //                 cellA.value = item.title;

    //                 // Aplicar estilos al título
    //                 cellA.font = { bold: true, size: 14 };
    //                 cellA.fill = {
    //                     type: 'pattern',
    //                     pattern: 'solid',
    //                     fgColor: { argb: 'FFD3D3D3' } // Gris claro
    //                 };
    //                 cellA.alignment = {
    //                     horizontal: 'center',
    //                     vertical: 'middle'
    //                 };

    //                 // Hacer merge de A hasta F (columnas 1-6)
    //                 worksheet.mergeCells(rowIndex, 1, rowIndex, 6);

    //                 // Limpiar celdas B-F (ya están merged pero por si acaso)
    //                 for (let col = 2; col <= 6; col++) {
    //                     row.getCell(col).value = null;
    //                 }

    //                 rowIndex++;
    //             } else if (item.type === 'item') {
    //                 const row = worksheet.getRow(rowIndex);

    //                 // Agregar datos en cada columna
    //                 row.getCell(1).value = item.item; // A - Item #
    //                 row.getCell(2).value = item.quantity; // B - Quantity
    //                 row.getCell(3).value = item.materialRef?.material || item.description; // C - Description
    //                 row.getCell(5).value = item.length; // E - Length
    //                 row.getCell(6).value = item.used; // F - Used
    //                 row.getCell(7).value = item.annotations || ''; // G - Annotations
    //                 row.getCell(8).value = item.price; // H - Price

    //                 // Aplicar formato de moneda a la columna H
    //                 row.getCell(8).numFmt = '$#,##0.00';

    //                 rowIndex++;
    //             }
    //         });

    //         // Generar el archivo
    //         const buffer = await workbook.xlsx.writeBuffer();

    //         // Descargar el archivo
    //         const projectName = this.form.get('project')?.value || 'lumber_estimate';
    //         const fileName = `${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    //         const blob = new Blob([buffer], {
    //             type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    //         });

    //         const url = window.URL.createObjectURL(blob);
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = fileName;
    //         link.click();
    //         window.URL.revokeObjectURL(url);

    //         this.notificationService.success('Excel file exported successfully', false);
    //     } catch (error) {
    //         console.error('Error exporting to Excel:', error);
    //         this.notificationService.error('Error exporting file', false);
    //     } finally {
    //         this.loadingExport.set(false);
    //     }
    // }

    public async exportToExcel() {
        try {
            this.loadingExport.set(true);

            // Cargar el template
            const response = await fetch('assets/template/Template.xlsx');
            const arrayBuffer = await response.arrayBuffer();

            // Crear workbook con ExcelJS
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            // Obtener la primera hoja
            const worksheet = workbook.getWorksheet(1);

            if (!worksheet) {
                throw new Error('Worksheet not found');
            }

            // ========== AGREGAR INFORMACIÓN DEL PROYECTO ==========
        
            // Nombre del proyecto en A9 (que ya está merged con D9)
            const projectCell = worksheet.getCell('A9');
            projectCell.value = this.form.get('project')?.value || '';
            projectCell.alignment = { horizontal: 'left', vertical: 'middle' };
            
            // Estimador en E10 (que ya está merged con F10)
            const estimatorCell = worksheet.getCell('E10');
            estimatorCell.value = this.form.get('estimator')?.value?.name || '';
            estimatorCell.alignment = { horizontal: 'left', vertical: 'middle' };

            // ========== CONTINUAR CON LOS DATOS DESDE FILA 15 ==========

            // Empezar desde la fila 14
            let rowIndex = 15;

            this.items().forEach(item => {
                if (item.type === 'title') {
                    const row = worksheet.getRow(rowIndex);

                    // Agregar el título en la celda A
                    const cellA = row.getCell(1); // Columna A
                    cellA.value = item.title;

                    // Aplicar estilos al título
                    cellA.font = { bold: true, size: 14 };
                    cellA.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD3D3D3' } // Gris claro
                    };
                    cellA.alignment = {
                        horizontal: 'center',
                        vertical: 'middle'
                    };

                    // Aplicar el mismo background a las celdas B-F para que se vea uniforme
                    for (let col = 2; col <= 6; col++) {
                        const cell = row.getCell(col);
                        cell.value = null;
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFD3D3D3' }
                        };
                    }
                    // Idea que quite el mergue si es que hay y despues lo vuelva a hacer

                    worksheet.mergeCells(rowIndex, 1, rowIndex, 6);

                    rowIndex++;
                } else if (item.type === 'item') {
                    const row = worksheet.getRow(rowIndex);

                    // Agregar datos en cada columna
                    // IMPORTANTE: Forzar el tipo de dato como número
                    const cellA = row.getCell(1);
                    cellA.value = item.item; // A - Item #
                    cellA.numFmt = '0'; // Formato de número entero

                    const cellB = row.getCell(2);
                    cellB.value = item.quantity; // B - Quantity
                    cellB.numFmt = '0'; // Formato de número entero

                    row.getCell(3).value = item.materialRef?.material || item.description; // C - Description
                    
                    const cellE = row.getCell(5);
                    cellE.value = item.length; // E - Length
                    cellE.numFmt = '0'; // Formato de número entero

                    row.getCell(6).value = item.used; // F - Used
                    
                    // Limpiar cualquier background que pudiera tener del template
                    for (let col = 1; col <= 6; col++) {
                        const cell = row.getCell(col);
                        // Solo limpiar fill si existe
                        if (cell.fill) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'none'
                            };
                        }
                    }

                    rowIndex++;
                }
            });

            // Generar el archivo
            const buffer = await workbook.xlsx.writeBuffer();

            // Descargar el archivo
            const projectName = this.form.get('project')?.value || 'lumber_estimate';
            const fileName = `${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`;

            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);

            this.notificationService.success('Excel file exported successfully', false);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.notificationService.error('Error exporting file', false);
        } finally {
            this.loadingExport.set(false);
        }
    }
}
