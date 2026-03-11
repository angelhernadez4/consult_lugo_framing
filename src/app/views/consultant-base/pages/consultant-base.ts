import { Component, effect, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GdataService } from '@core/services/gdata';
import { NotificationService } from '@core/services/notification';
import { Item } from '../interfaces';
import { Material } from '@views/materials/interfaces';
import * as ExcelJS from 'exceljs';
import { LocalStorageService } from '@core/services/local-storage';
import { MaterialService } from '@views/materials/services/material';
import { formatCurrency } from '../../../core/utils/format';
import { QuoteService } from '@views/quotes/services/quote';

@Component({
    selector: 'app-consultant-base',
    imports: [],
    templateUrl: './consultant-base.html',
})
export abstract class ConsultantBase {
    protected readonly fb: FormBuilder = inject(FormBuilder);
    protected readonly gdataService: GdataService = inject(GdataService);
    protected readonly materialService: MaterialService = inject(MaterialService)
    protected readonly notificationService: NotificationService = inject(NotificationService);
    protected readonly localStorageService: LocalStorageService = inject(LocalStorageService)
    protected readonly quoteService: QuoteService = inject(QuoteService);

    // Señales comunes
    public loadingData: WritableSignal<boolean> = signal(false);
    public loadingExport: WritableSignal<boolean> = signal(false);
    public visibleDialog: WritableSignal<boolean> = signal(false);
    public data: WritableSignal<Material[]> = signal([]);
    public items: WritableSignal<Item[]> = signal([]);
    public itemCounter: WritableSignal<number> = signal(1);
    public currentDate: WritableSignal<Date> = signal(new Date());
    public quoteId: WritableSignal<number | null> = signal(null);
    public loadingQuote: WritableSignal<boolean> = signal(false);

    public refreshItem: any[] = [
        { icon: 'pi pi-refresh', command: () => this.getData() }

    ]

    // Datos comunes
    public estimator: any[] = [
        { name: 'Jonathan Lugo' },
        { name: 'Odilon Lugo' },
        { name: 'Oscar Muñoz' },
        { name: 'Adilen Guiterrez' },
    ];

    public itemsButton: WritableSignal<any[]> = signal([
        // { label: 'Export with prices', icon: 'pi pi-dollar', command: () => this.exportToExcel(true) },
        // { label: 'Export without prices', icon: 'pi pi-eye-slash', command: () => this.exportToExcel(false) },
        { label: 'Export PDF', icon: 'pi pi-file-pdf', command: () => this.exportToPDF(false) },
        { label: 'Export PDF with prices', icon: 'pi pi-file-pdf', command: () => this.exportToPDF(true) },
    ]);

    // Formularios
    public formTitle: FormGroup = this.fb.group({
        title: ['', Validators.required]
    });

    public form!: FormGroup;

    // Propiedades abstractas que cada hijo debe implementar
    abstract materialType: 'lumber' | 'hardware' | 'siding';
    abstract templatePath: string;
    abstract templatePathWithPrices: string;
    abstract estimatorCellPosition: string;
    abstract positionTitleTotal: number;
    abstract positionValueTotal: number;

    // Número de columnas para el merge de títulos (puede ser sobrescrito)
    protected titleMergeColumns: number = 6;
    protected titleMergeColumnsWithPrices: number = 7;

    ngOnInit(): void {
        this.initializeForm();
        this.loadFromStorage();
        this.getData();
    }

    protected get storageKey(): string {
        return `consultant_${this.materialType}`;
    }

    protected saveToStorage(): void {
        const payload = {
            items: this.items(),
            itemCounter: this.itemCounter(),
            form: this.form?.getRawValue(),
            date: this.currentDate()
        };

        this.localStorageService.saveItem(this.storageKey, payload)
    }


    // Método abstracto para inicializar el formulario específico
    protected abstract initializeForm(): void;

    // Método abstracto para calcular el precio según el tipo de material
    protected abstract calculatePrice(formValue: any, material: Material): number;

    // Método abstracto para crear el item específico
    protected abstract createItem(formValue: any, material: Material, price: number): Item;

    public getData() {
        this.loadingData.set(true);

        switch (this.materialType) {
            case 'lumber':
                this.materialService.getMaterialByCategory(['Lumber']).subscribe(material => {
                    if (material === null) return
                    this.data.set(material as Material[])
                    this.loadingData.set(false)
                })
                break;
            case 'hardware':
                this.materialService.getMaterialByCategory(['Hardware']).subscribe(material => {
                    if (material === null) return
                    this.data.set(material as Material[])
                    this.loadingData.set(false)
                })
                break;
            case 'siding':
                this.materialService.getMaterialByCategory(['Siding']).subscribe(material => {
                    if (material === null) return
                    this.data.set(material as Material[])
                    this.loadingData.set(false)
                })
                break;
        }
    }

    // Calcular totales
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

    // Agregar item
    public addItem(): void {
        if (this.form.invalid) return;

        const formValue = this.form.getRawValue();
        const selectedMaterial = formValue.description;

        const price = this.calculatePrice(formValue, selectedMaterial);
        const currentItem = this.itemCounter();

        const newItem = this.createItem(formValue, selectedMaterial, price);
        newItem.item = currentItem;
        newItem.type = 'item';

        this.items.update(items => [...items, newItem]);
        this.itemCounter.set(currentItem + 1);
        this.resetFormKeepProject();
        this.saveToStorage();
    }

    // Diálogo de títulos
    public openDialog(): void {
        this.visibleDialog.set(true);
    }

    public closeDialog(): void {
        this.visibleDialog.set(false);
    }

    public addTitle(): void {
        const title = this.formTitle.get('title')?.value;
        this.items.update(items => [
            ...items,
            { type: 'title', title }
        ]);
        this.formTitle.reset();
        this.closeDialog();
        this.saveToStorage();
    }

    public onTitleSave(row: any, index: number): void {
        if (row.type !== 'title') return;

        this.items.update(items => {
            const copy = [...items];
            copy[index] = { ...copy[index], title: row.title };
            return copy;
        });

        this.saveToStorage();
    }

    public onTitleDelete(row: any, index: number): void {
        const title = this.items()[index];

        const message = `Are you sure you want to delete the title "${title.title}"?`;

        this.notificationService.showConfirm({ message }, () => {
            this.items.update(items => {
                const copy = [...items];
                copy.splice(index, 1);
                return copy;
            });

            this.saveToStorage();
            this.reindexItems();
            this.notificationService.success('Title deleted', false);
        });
    }

    // Editar fila
    public onRowSave(row: Item): void {
        if (row.type === 'title' || !row.materialRef) return;

        const price = this.calculatePrice(row, row.materialRef);

        this.items.update(items =>
            items.map(item =>
                item.type === 'item' && item.item === row.item
                    ? { ...item, ...row, price: Number(price.toFixed(2)) }
                    : item
            )
        );
        this.saveToStorage();
    }

    // Eliminar fila
    public onRowDelete(item: Item): void {
        const message = `Are you sure you want to delete ${item.description}?`;
        this.notificationService.showConfirm({ message }, () => {
            this.items.update(items => items.filter(i => i.item !== item.item));
            this.notificationService.success('successfully deleted', false)
            this.reindexItems();
            this.saveToStorage();
        });
    }

    // Reindexar items
    private reindexItems(): void {
        let counter = 1;
        this.items.update(items =>
            items.map(item => {
                if (item.type === 'item') {
                    return { ...item, item: counter++ };
                }
                return item;
            })
        );
        this.itemCounter.set(counter);
    }

    // Reset formulario
    public resetFormKeepProject(): void {
        const project = this.form.get('project')?.value;
        const estimator = this.form.get('estimator')?.value;

        this.form.reset({ project, estimator });
        this.notificationService.success('Item added correctly', false);
    }

    // Exportar a Excel (método base, puede ser sobrescrito)
    public async exportToExcel(withPrices: boolean = false): Promise<void> {
        try {
            this.loadingExport.set(true);

            const selectedTemplate = withPrices ? this.templatePathWithPrices : this.templatePath;

            const response = await fetch(selectedTemplate);
            const arrayBuffer = await response.arrayBuffer();

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);

            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) throw new Error('Worksheet not found');

            // Información del proyecto
            const lumberCell = worksheet.getCell('A8');
            lumberCell.value = `${this.materialType.charAt(0).toUpperCase() + this.materialType.slice(1)} Quote`;

            const projectCell = worksheet.getCell('A9');
            projectCell.value = this.form.get('project')?.value || '';
            projectCell.alignment = { horizontal: 'left', vertical: 'middle' };

            const dateCell = worksheet.getCell('A10');
            dateCell.value = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const estimatorCell = worksheet.getCell(this.estimatorCellPosition);
            estimatorCell.value = this.form.get('estimator')?.value?.name || '';
            estimatorCell.alignment = { horizontal: 'left', vertical: 'middle' };

            // Agregar datos
            let rowIndex = 15;
            let itemNumber = 1;
            let lastTableRowIndex = rowIndex;

            this.items().forEach(item => {
                if (item.type === 'title') {
                    const TITLE_FILL = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' } // gris medio suave
                    } as const;
                    const row = worksheet.getRow(rowIndex);
                    const cellA = row.getCell(1);
                    cellA.value = item.title;
                    cellA.font = { bold: true, size: 14 };
                    cellA.alignment = { horizontal: 'center', vertical: 'middle' };
                    worksheet.mergeCells(rowIndex, 1, rowIndex, withPrices ? this.titleMergeColumnsWithPrices : this.titleMergeColumns);
                    const lastColumn = withPrices
                        ? this.titleMergeColumnsWithPrices
                        : this.titleMergeColumns;

                    // ===== Background del título =====
                    for (let col = 1; col <= lastColumn; col++) {
                        row.getCell(col).fill = TITLE_FILL;
                    }
                    lastTableRowIndex = rowIndex;
                    rowIndex++;
                } else if (item.type === 'item') {
                    this.addItemToWorksheet(worksheet, rowIndex, item, itemNumber, withPrices);
                    lastTableRowIndex = rowIndex;
                    itemNumber++;
                    rowIndex++;
                }
            });

            const lastRow = worksheet.getRow(lastTableRowIndex);

            // Define hasta qué columna quieres el cierre visual
            const lastColumn = withPrices
                ? this.titleMergeColumnsWithPrices
                : this.titleMergeColumns;

            for (let col = 1; col <= lastColumn; col++) {
                const cell = lastRow.getCell(col);

                cell.border = {
                    ...cell.border,
                    bottom: { style: 'thin' } // puedes usar 'medium' si lo quieres más marcado
                };
            }

            // ========== AGREGAR TOTALES (solo si withPrices es true) ==========
            if (withPrices) {
                // Dejar una fila en blanco
                rowIndex++;

                // SUBTOTAL
                const subtotalRow = worksheet.getRow(rowIndex);
                subtotalRow.getCell(this.positionTitleTotal).value = 'Subtotal:';
                subtotalRow.getCell(this.positionTitleTotal).font = { size: 13 };
                subtotalRow.getCell(this.positionValueTotal).value = formatCurrency(this.subtotal);
                subtotalRow.getCell(this.positionValueTotal).font = { bold: true, size: 14 };
                rowIndex++;

                // TAXES
                const taxesRow = worksheet.getRow(rowIndex);
                taxesRow.getCell(this.positionTitleTotal).value = 'Taxes';
                taxesRow.getCell(this.positionTitleTotal).font = { size: 13 };
                taxesRow.getCell(this.positionValueTotal).value = formatCurrency(this.taxes);
                taxesRow.getCell(this.positionValueTotal).font = { bold: true, size: 14 };
                rowIndex++;

                // PROFIT
                const profitRow = worksheet.getRow(rowIndex);
                profitRow.getCell(this.positionTitleTotal).value = 'Profit (15%):';
                profitRow.getCell(this.positionTitleTotal).font = { size: 13 };
                profitRow.getCell(this.positionValueTotal).value = formatCurrency(this.profit);
                profitRow.getCell(this.positionValueTotal).font = { bold: true, size: 14 };
                rowIndex++;

                // TOTAL
                const totalRow = worksheet.getRow(rowIndex);
                totalRow.getCell(this.positionTitleTotal).value = 'TOTAL:';
                totalRow.getCell(this.positionTitleTotal).font = { size: 13 };
                totalRow.getCell(this.positionValueTotal).value = formatCurrency(this.total);
                totalRow.getCell(this.positionValueTotal).font = { bold: true, size: 14 };
            }
 
            // Generar archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const projectName = this.form.get('project')?.value || `${this.materialType}_estimate`;
            const fileName = `${projectName}_${withPrices ? 'with_prices_': ''}${new Date().toISOString().split('T')[0]}.xlsx`;

            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);

            this.notificationService.success('Excel exported successfully', false);
        } catch (error) {
            console.error('Error exporting:', error);
            this.notificationService.error('Error exporting file', false);
        } finally {
            this.loadingExport.set(false);
        }
    }

    // Método para agregar item al worksheet (puede ser sobrescrito)
    protected addItemToWorksheet(worksheet: any, rowIndex: number, item: Item, itemNumber: number, withPrices: boolean = false): void {
        const row = worksheet.getRow(rowIndex);
        row.getCell(1).value = itemNumber;
        row.getCell(2).value = item.quantity;
        row.getCell(3).value = item.materialRef?.name || item.description;
        row.getCell(5).value = item.length;
        row.getCell(6).value = item.used;

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

    private async getBase64ImageFromURL(url: string): Promise<string> {
        const data = await fetch(url);
        const blob = await data.blob();

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        });
    }

    // Métodos que las clases hijas pueden sobreescribir
    protected getPDFHeaders(withPrices: boolean): string[][] {
        return withPrices
            ? [['#', 'Qty', 'Description', 'Length', 'Price', 'Used', 'Annotations']]
            : [['#', 'Qty', 'Description', 'Length', 'Used', 'Annotations']];
    }

    protected getPDFColumns(withPrices: boolean): number {
        return withPrices ? 7 : 6;
    }

    protected buildPDFRow(item: Item, itemNumber: number, withPrices: boolean): any[] {
        return withPrices
            ? [itemNumber, item.quantity, item.materialRef?.name || item.description, item.length ? `${item.length}'` : '', formatCurrency(item.price!), item.used, item.annotations]
            : [itemNumber, item.quantity, item.materialRef?.name || item.description, item.length ? `${item.length}'` : '', item.used, item.annotations];
    }

    public async exportToPDF(withPrices: boolean = false) {
        try {
            this.loadingExport.set(true);

            const logoUrl = 'assets/img/logo.png';
            const logoBase64 = await this.getBase64ImageFromURL(logoUrl);
            
            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
            // // ── Encabezado ──────────────────────────────────────────────

            // ── Construir filas ──────────────────────────────────────────
            const head = this.getPDFHeaders(withPrices);

            const body: any[] = [];
            let itemNumber = 1;
            const columns = this.getPDFColumns(withPrices);

            this.items().forEach(item => {
                if (item.type === 'title') {
                    // Fila de título que abarca todas las columnas
                    body.push([{ content: item.title, colSpan: columns, styles: { halign: 'center', fontStyle: 'bold', fillColor: [224, 224, 224] } }]);
                } else if (item.type === 'item') {
                    body.push(this.buildPDFRow(item, itemNumber, withPrices));
                    itemNumber++;
                }
            });

            // ── Tabla ────────────────────────────────────────────────────
            autoTable(doc, {
                head,
                body,
                startY: 160,
                margin: {
                    top: 160,
                    left: 40,
                    right: 40,
                    bottom: 40
                },
                styles: { fontSize: 9, cellPadding: 4 },

                didDrawPage: (data) => {

                    // LOGO
                    doc.addImage(
                        logoBase64,
                        'PNG',
                        40,   // X
                        20,   // Y
                        120,   // ancho
                        100    // alto
                    );

                    // TITLE COMPANY
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(24);
                    doc.text('Lugo Framing', 425, 40) // 605 is for landscape

                    doc.setFontSize(8)
                    doc.text('3835 Glen St.', 425, 62)
                    doc.text('Reno, NV. 89502', 425, 74)
                    doc.text('(775) 870-1128', 425, 86)

                    // TITULO
                    doc.setFontSize(18);
                    doc.text(
                        `${this.materialType.charAt(0).toUpperCase() + this.materialType.slice(1)} Quote`,
                        140,
                        60
                    );


                    // DATOS
                    doc.setFontSize(11);

                    doc.text(this.form.get('project')?.value || '', 140, 80);
                    doc.setFontSize(10)
                    doc.text(
                        new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        140,
                        100
                    );
                    doc.text(
                        `Estimator: ${this.form.get('estimator')?.value?.name || ''}`,
                        425,
                        120
                    );
                }
            });

            // ── Totales ──────────────────────────────────────────────────
            if (withPrices) {
                const pageHeight = doc.internal.pageSize.getHeight();
                const pageWidth = doc.internal.pageSize.getWidth();
                const rightMargin = 40;
                const labelX = pageWidth - 200;
                const valueX = pageWidth - rightMargin;
                const bottomMargin = 40;
                const totalsBlockHeight = 70; // altura aproximada del bloque de totales

                let finalY = (doc as any).lastAutoTable.finalY + 15;

                // Si no hay espacio suficiente, agregar nueva página
                if (finalY + totalsBlockHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    finalY = 40; // reiniciar Y en la nueva página
                }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');

                doc.text('Subtotal:', labelX, finalY);
                doc.text(formatCurrency(this.subtotal), valueX, finalY, { align: 'right' });

                doc.text('Taxes:', labelX, finalY + 18);
                doc.text(formatCurrency(this.taxes), valueX, finalY + 18, { align: 'right' });

                doc.text('Profit (15%):', labelX, finalY + 36);
                doc.text(formatCurrency(this.profit), valueX, finalY + 36, { align: 'right' });

                doc.setLineWidth(0.5);
                doc.line(labelX, finalY + 44, pageWidth - rightMargin, finalY + 44);

                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Total:', labelX, finalY + 60);
                doc.text(formatCurrency(this.total), valueX, finalY + 60, { align: 'right' });
            }

            // ── Guardar ──────────────────────────────────────────────────
            const projectName = this.form.get('project')?.value || `${this.materialType}_estimate`;
            const fileName = `${projectName}_${withPrices ? 'with_prices_' : ''}${new Date().toISOString().split('T')[0]}.pdf`;
            const data = {
                version: '1.0',
                materialType: this.materialType,
                quoteId: this.quoteId() ?? null,
                form: {
                    project: this.form.get('project')?.value || '',
                    estimator: this.form.get('estimator')?.value || null,
                },
                items: this.items()
            };

            // Incrustar en las propiedades del PDF
            doc.setProperties({
                title: `${this.materialType} Quote`,
                subject: JSON.stringify(data), // 👈 aquí va el JSON
                author: this.form.get('estimator')?.value?.name || '',
                creator: 'Lugo Framing App'
            });
            const pdfArrayBuffer = doc.output('arraybuffer');
            const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);
            this.notificationService.success('PDF exported successfully', false);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.notificationService.error('Error exporting PDF file', false);
        } finally {
            this.loadingExport.set(false);
        }
    }

    public importFromPDF(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const { PDFDocument } = await import('pdf-lib');
                const pdfBytes = e.target?.result as ArrayBuffer;
                const pdfDoc = await PDFDocument.load(pdfBytes);

                // Extraer el JSON del Subject
                const subject = pdfDoc.getSubject();
                if (!subject) {
                    this.notificationService.error('This PDF has no quote data embedded', false);
                    return;
                }

                const data = JSON.parse(subject);

                // Validaciones
                if (!data.version || !data.items) {
                    this.notificationService.error('Invalid quote file', false);
                    return;
                }

                if (data.materialType !== this.materialType) {
                    this.notificationService.error(
                        `This quote is for ${data.materialType}, not ${this.materialType}`,
                        false
                    );
                    return;
                }

                // Restaurar
                this.form.patchValue({
                    project: data.form.project,
                    estimator: data.form.estimator,
                });
                this.items.set(data.items.map((item: any) => ({
                    ...item,
                    unit: typeof item.unit === 'string'
                        ? { name: item.unit, label: item.unit }
                        : item.unit
                })));

                // Si tiene quoteId significa que ya fue guardado antes
                if (data.quoteId) {
                    this.quoteId.set(data.quoteId);
                    this.notificationService.success('Quote loaded — saving will update the existing record', false);
                } else {
                    this.quoteId.set(null);
                    this.notificationService.success('Quote imported from PDF successfully', false);
                }
                this.saveToStorage();

                this.notificationService.success('Quote imported from PDF successfully', false);
            } catch {
                this.notificationService.error('Error reading PDF file', false);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    protected loadFromStorage(): void {
        const raw = localStorage.getItem(this.storageKey);
        
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);

            this.items.set(parsed.items ?? []);
            
            this.itemCounter.set(parsed.itemCounter ?? 1);
            this.currentDate.set(new Date(parsed.date));

            if (parsed.form && this.form) {
                this.form.patchValue(parsed.form);
            }
        } catch (e) {
            console.error('Error loading storage', e);
        }
    }

    public clearStorage(): void {
        this.notificationService.showConfirm({ message: 'Are you sure you want to clear this consult?' }, () => {
            localStorage.removeItem(this.storageKey);
            this.items.set([]);
            this.itemCounter.set(1);
            this.form.reset();
        })
    }

    protected calculateTotalsByTitle(): Map<number, number> {
        const totals = new Map<number, number>();

        let currentTitleIndex: number | null = null;
        let currentTotal = 0;

        this.items().forEach((item, index) => {
            if (item.type === 'title') {
                // Guardar el total del título anterior
                if (currentTitleIndex !== null) {
                    totals.set(currentTitleIndex, Number(currentTotal.toFixed(2)));
                }

                currentTitleIndex = index;
                currentTotal = 0;
            }

            if (item.type === 'item' && currentTitleIndex !== null) {
                currentTotal += item.price ?? 0;
            }
        });

        // Guardar último título
        if (currentTitleIndex !== null) {
            totals.set(currentTitleIndex, Number(currentTotal.toFixed(2)));
        }

        return totals;
    }

    isLastItemOfTitle(index: number): boolean {
        const items = this.items();

        const current = items[index];
        const next = items[index + 1];

        if (current?.type !== 'item') return false;

        // Último item antes de otro título o fin del array
        return !next || next.type === 'title';
    }

    getTitleSubtotal(index: number): number {
        const items = this.items();

        let total = 0;

        for (let i = index; i >= 0; i--) {
            if (items[i].type === 'title') break;
            if (items[i].type === 'item') {
            total += items[i].price || 0;
            }
        }

        return total;
    }

    public onRowReorder(event: any): void {
        // PrimeNG ya reordena el array automáticamente
        // Solo necesitamos reindexar y guardar
        this.reindexItems();
        this.saveToStorage();
        this.notificationService.success('Order updated', false);
    }

    // método compartido que puedes poner en un servicio base o helper
    public buildQuotePayload(type: 'Lumber' | 'Hardware' | 'Siding') {
        let state
        switch (type) {
            case 'Lumber':
                state = JSON.parse(localStorage.getItem('consultant_lumber')!);
                break;
            case 'Hardware':
                state = JSON.parse(localStorage.getItem('consultant_hardware')!);
                break;
            case 'Siding':
                state = JSON.parse(localStorage.getItem('consultant_siding')!);
                break;
        }
        // const state = JSON.parse(localStorage.getItem('consultant_lumber')!);

        return {
            project: state.form.project,
            estimator: state.form.estimator.name,
            total_price: state.items
                .filter((i: any) => i.type === 'item')
                .reduce((acc: number, i: any) => acc + i.price, 0),
            quote_type: type,
            created_by: state.form.estimator.name,
            items: state.items.map((item: any, index: number) => ({
                type: item.type,
                item_order: index,
                title: item.title ?? null,
                quantity: item.quantity ?? null,
                unit: typeof item.unit === 'string' ? item.unit : item.unit?.name ?? null,
                description: item.description ?? null,
                material_id: item.materialRef?.id ?? null,
                length: item.length ?? null,
                price: Number(item.price) ?? null,
                used: item.used ?? null,
                annotations: item.annotations ?? null,
            }))
        };
    }

    public saveQuote() {        
        this.loadingQuote.set(true);
        const type = (this.materialType.charAt(0).toUpperCase() + this.materialType.slice(1)) as 'Lumber' | 'Hardware' | 'Siding';
        const quoteData = this.buildQuotePayload(type);

        const request$ = this.quoteId()
            ? this.quoteService.update(quoteData, this.quoteId()!)
            : this.quoteService.create(quoteData);

        request$.subscribe((res: any) => {
            this.loadingQuote.set(false);

            if (!this.quoteId()) {
                this.quoteId.set(res.id);
            }

            localStorage.removeItem(this.storageKey);
            this.items.set([]);
            this.itemCounter.set(1);
            this.form.reset();
            this.currentDate.set(new Date());
            
            this.notificationService.success(
                this.quoteId() ? 'Quote updated successfully' : 'Quote created successfully',
                false
            );
            this.quoteId.set(null);
        });
    }
}
