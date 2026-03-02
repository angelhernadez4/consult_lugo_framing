import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Read } from '@core/abstracts/base-read';
import { DETAIL_IMPORTS } from '@core/utils';
import { Material, MaterialDetailState } from '@views/materials/interfaces';
import { MaterialService } from '@views/materials/services/material';

@Component({
    selector: 'app-material-detail',
    imports: [DETAIL_IMPORTS, CurrencyPipe, DatePipe],
    templateUrl: './material-detail.html',
    styleUrl: './material-detail.scss',
})
export default class MaterialDetail extends Read<MaterialDetailState> implements OnInit, OnDestroy {
    private readonly materialService: MaterialService = inject(MaterialService);

    public material: WritableSignal<Material | undefined> = signal(undefined)
    protected override state: WritableSignal<MaterialDetailState> = signal({ loadingData: false })

    ngOnInit(): void {
        this.initialize(this.materialService)
        const routeSub = this.readId(id => this.getMaterial(id)).subscribe()
        this.subs.push(routeSub)
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe())
    }

    private getMaterial(id: number) {
        this.updateState({ loadingData: true })
        this.materialService.getById(id).subscribe(material => {
            if(this.hasGetError(material)) return;
            this.material.set(material as Material)
            this.updateState({ loadingData: false })
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
