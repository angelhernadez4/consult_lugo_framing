import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { List } from '@core/abstracts/base-list';
import { LIST_IMPORTS } from '@core/utils';
import { MaterialListPageState, Material } from '@views/materials/interfaces';
import { MaterialService } from '@views/materials/services/material';

@Component({
    selector: 'app-material-list',
    imports: [LIST_IMPORTS, CurrencyPipe],
    standalone: true,
    templateUrl: './material-list.html',
    styleUrl: './material-list.scss',
})
export default class MaterialList extends List<MaterialListPageState> implements OnInit {
    private readonly materialService: MaterialService = inject(MaterialService)

    public materials: WritableSignal<Material[]> = signal([])
    protected override state: WritableSignal<MaterialListPageState> = signal({ loadingData: true })

    ngOnInit(): void {
        this.initialize(this.materialService)
        this.getAll()
    }

    public onDelete(material: Material) {
        const { name, id } = material
        this.showConfirmDelete(name, this.materialService.delete(+id))
    }

    protected override getAll(): void {
        this.updateState({loadingData: true})
        this.materialService.getAll().subscribe(materials => {
            if (this.hasGetAllError(materials)) return
            this.materials.set(materials as Material[])
            this.updateState({loadingData: false})
        })
    }

    public colorSeverity(name: string) {
        switch(name) {
            case 'Lumber' :
                return 'info'
                break;
            case 'Hardware' :
                return 'warn'
                break;
            case 'Siding' :
                return 'success'
                break;
            default: 
                return 'success'
        }
    }
}
