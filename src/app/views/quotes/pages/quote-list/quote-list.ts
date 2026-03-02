import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { List } from '@core/abstracts/base-list';
import { formatCurrency, LIST_IMPORTS } from '@core/utils';
import { Quote } from '@views/quotes/interfaces';
import { QuoteListPageState } from '@views/quotes/interfaces/quotes-state';
import { QuoteService } from '@views/quotes/services/quote';

@Component({
    selector: 'app-quote-list',
    imports: [LIST_IMPORTS, CurrencyPipe],
    templateUrl: './quote-list.html',
    styleUrl: './quote-list.scss',
})
export default class QuoteList extends List<QuoteListPageState> implements OnInit {
    private readonly quoteService: QuoteService = inject(QuoteService)

    public quotes: WritableSignal<Quote[]> = signal([])
    protected override state: WritableSignal<QuoteListPageState> = signal({ loadingData: true })
    public exportingId: WritableSignal<number | null> = signal(null);

    ngOnInit(): void {
        this.initialize(this.quoteService)
        this.getAll()
    }

    public onDelete(quote: Quote) {
        const { project, id } = quote
        this.showConfirmDelete(project, this.quoteService.delete(+id))
    }

    protected override getAll(): void {
        this.updateState({loadingData: true})
        this.quoteService.getAll().subscribe(quotes => {
            if (this.hasGetAllError(quotes)) return;
            this.quotes.set(quotes as Quote[])
            this.updateState({loadingData: false})
        })
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
    public getExportMenuItems(quote: any) {
        return [
            {
                label: 'Export with prices',
                icon: 'pi pi-dollar',
                command: () => this.exportQuoteToPDF(quote, true)
            }
        ];
    }

    public async exportQuoteToPDF(quote: any, withPrices: boolean = false) {
        this.exportingId.set(quote.id);

        try {
            const logoUrl = 'assets/img/logo.png';
            const logoBase64 = await this.getBase64ImageFromURL(logoUrl);
            
            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

            // Config según tipo y withPrices
            const config = this.getPDFConfig(quote.quote_type, withPrices);

            const body: any[] = [];
            let itemNumber = 1;

            quote.items.forEach((item: any) => {
                if (item.type === 'title') {
                    body.push([{
                        content: item.title,
                        colSpan: config.headers.length,
                        styles: { halign: 'center', fontStyle: 'bold', fillColor: [224, 224, 224] }
                    }]);
                } else {
                    body.push(config.buildRow(item, itemNumber++));
                }
            });

            // autoTable(doc, {
            //     head: [config.headers],
            //     body,
            //     startY: 150,
            //     styles: { fontSize: 9, cellPadding: 4 },
            // });

            autoTable(doc, {
                head: [config.headers],
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
                        `${quote.quote_type} Quote`,
                        140,
                        60
                    );


                    // DATOS
                    doc.setFontSize(11);

                    doc.text(`${quote.project}`, 140, 80);
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
                        `Estimator: ${quote.estimator}}`,
                        425,
                        120
                    );
                }
            });

            // Totales solo si withPrices
            if (withPrices) {
                const pageHeight = doc.internal.pageSize.getHeight();
                const pageWidth = doc.internal.pageSize.getWidth();
                const rightMargin = 40;
                const labelX = pageWidth - 200;
                const valueX = pageWidth - rightMargin;
                const bottomMargin = 40;
                const totalsBlockHeight = 70;

                // Calcular desde el objeto quote
                const subtotal = Number(quote.items
                    .filter((i: any) => i.type === 'item')
                    .reduce((acc: number, i: any) => acc + Number(i.price ?? 0), 0));
                const taxes = Number(subtotal * 0.08256);
                const profit = Number((subtotal + taxes) * 0.15);
                const total = Number(subtotal + taxes + profit);

                let finalY = (doc as any).lastAutoTable.finalY + 15;

                if (finalY + totalsBlockHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    finalY = 40;
                }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');

                doc.text('Subtotal:', labelX, finalY);
                doc.text(formatCurrency(subtotal), valueX, finalY, { align: 'right' });

                doc.text('Taxes:', labelX, finalY + 18);
                doc.text(formatCurrency(taxes), valueX, finalY + 18, { align: 'right' });

                doc.text('Profit (15%):', labelX, finalY + 36);
                doc.text(formatCurrency(profit), valueX, finalY + 36, { align: 'right' });

                doc.setLineWidth(0.5);
                doc.line(labelX, finalY + 44, pageWidth - rightMargin, finalY + 44);

                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Total:', labelX, finalY + 60);
                doc.text(formatCurrency(total), valueX, finalY + 60, { align: 'right' });
            }

            const fileName = `${quote.project}_${quote.quote_type}_${withPrices ? 'with_prices_' : ''}${quote.id}.pdf`;
            const embedData = {
                version: '1.0',
                materialType: quote.quote_type.toLowerCase(),
                form: {
                    project: quote.project,
                    estimator: { name: quote.estimator },
                },
                items: quote.items.map((item: any) => ({
                    type: item.type,
                    title: item.title ?? null,
                    quantity: item.quantity ?? null,
                    unit: item.unit ?? null,
                    description: item.description ?? null,
                    materialRef: item.material ?? null,
                    length: item.length ?? null,
                    price: Number(item.price) ?? null,
                    used: item.used ?? null,
                    annotations: item.annotations ?? null,
                    item: item.item_order ?? null,
                }))
            };

            doc.setProperties({
                title: `${quote.quote_type} Quote`,
                subject: JSON.stringify(embedData),
                author: quote.estimator,
                creator: 'Lugo Framing App'
            });
            doc.save(fileName);


        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            this.exportingId.set(null);
        }
    }

    private getPDFConfig(quoteType: string, withPrices: boolean): { headers: string[], buildRow: (item: any, num: number) => any[] } {
        switch (quoteType.toLowerCase()) {
            case 'hardware':
                return {
                    headers: withPrices
                        ? ['#', 'Qty', 'Unit', 'Description', 'Price', 'Annotations']
                        : ['#', 'Qty', 'Unit', 'Description', 'Annotations'],
                    buildRow: (item, num) => withPrices
                        ? [num, item.quantity, item.unit ?? '', item.description, formatCurrency(Number(item.price ?? 0)), item.annotations ?? '']
                        : [num, item.quantity, item.unit ?? '', item.description, item.annotations ?? '']
                };
            case 'siding':
                return {
                    headers: withPrices
                        ? ['#', 'Qty', 'Unit', 'Description', 'Length', 'Price', 'Annotations']
                        : ['#', 'Qty', 'Unit', 'Description', 'Length', 'Annotations'],
                    buildRow: (item, num) => withPrices
                        ? [num, item.quantity, item.unit ?? '', item.description, item.length ? `${item.length}'` : '', formatCurrency(Number(item.price ?? 0)), item.annotations ?? '']
                        : [num, item.quantity, item.unit ?? '', item.description, item.length ? `${item.length}'` : '', item.annotations ?? '']
                };
            case 'lumber':
            default:
                return {
                    headers: withPrices
                        ? ['#', 'Qty', 'Description', 'Length', 'Price', 'Used', 'Annotations']
                        : ['#', 'Qty', 'Description', 'Length', 'Used', 'Annotations'],
                    buildRow: (item, num) => withPrices
                        ? [num, item.quantity, item.description, item.length ? `${item.length}'` : '', formatCurrency(Number(item.price ?? 0)), item.used ?? '', item.annotations ?? '']
                        : [num, item.quantity, item.description, item.length ? `${item.length}'` : '', item.used ?? '', item.annotations ?? '']
                };
        }
    }
}
