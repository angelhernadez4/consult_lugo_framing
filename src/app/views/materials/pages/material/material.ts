import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Operational } from '@core/abstracts/base-operational';
import { OperationCases } from '@core/interfaces';
import { OPERATIONAL_IMPORTS } from '@core/utils';
import { MATERIAL_FORM_CONTROLS_NAMES, MaterialCore, MaterialForm, MaterialPageState, Material as MaterialI } from '@views/materials/interfaces';
import { MaterialService } from '@views/materials/services/material';
import { switchMap } from 'rxjs';

@Component({
    selector: 'app-material',
    standalone: true,
    imports: [OPERATIONAL_IMPORTS],
    templateUrl: './material.html',
    styleUrl: './material.scss',
})
export default class Material extends Operational<MaterialPageState> implements OnInit, OnDestroy {
    private readonly materialService: MaterialService = inject(MaterialService)

    public formControlNames = MATERIAL_FORM_CONTROLS_NAMES
    public form: FormGroup = this.fb.group({
        [MaterialForm.NAME] : ['', Validators.required],
        [MaterialForm.FULL_NAME] : ['', Validators.required],
        [MaterialForm.UNIT_TYPE] : [''],
        [MaterialForm.UNIT_PRICE] : [, ],
        [MaterialForm.UNIT_PRICE_BOX] : [,],
        [MaterialForm.UNIT_AREA_SF] : [,],
        [MaterialForm.UNIT_LENGTH] : [,],
        [MaterialForm.QTY_PER_BOX] : [,],
        [MaterialForm.DUE_DATE] : [,],
        [MaterialForm.CATEGORY_IDS] : [[], Validators.required],
    })

    public state: WritableSignal<MaterialPageState> = signal({
        case: OperationCases.CREATE,
        loadingData: false,
        loadingSubmit: false,
        materialId: 0
    })

    public units = [
        { name: 'EA', label: 'EA' },
        { name: 'BOX', label: 'BOX' },
        { name: 'LF', label: 'LF' },
        { name: 'SF', label: 'SF' },
    ];

    public selectedFile: File | null = null;
    public currentImageUrl: string | null = null;

    ngOnInit(): void {
        this.initialize(this.materialService)
        this.updateState({loadingData: true})
        this.setCase(id => this.getMaterial(id))
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe())
    }

    get selectedUnit(): string {
        return this.form.get(this.formControlNames.UNIT_TYPE)?.value;
    }

    get selectTypeMaterial() : boolean {
        const categoryIds = this.form.get(this.formControlNames.CATEGORY_IDS)?.value || [];
        return categoryIds.includes('2');
    }

    public submit() {
        if (this.isInvalidForm()) return;
        this.updateState({loadingSubmit: true})
        const material: MaterialCore = this.form.getRawValue()
        material.category_ids = material.category_ids.map(Number)
        if (this.state().case === OperationCases.CREATE) {
            this.createMaterial(material)
            return
        }
        this.updateMaterial(material, this.state().materialId!)
    }

    private createMaterial(material: MaterialCore) {
        if (this.selectedFile) {
            this.materialService.uploadImage([this.selectedFile]).pipe(
                    switchMap(imageUrl => {
                        const payload = { ...material, image_url: imageUrl }
                    return this.materialService.create(payload);
                })
            ).subscribe(success => {
                this.updateState({ loadingSubmit: false });
                this.handleOperationRes(success);
            });
            return;
        }
        this.materialService.create(material).subscribe(success => {
            this.updateState({loadingSubmit: false})
            this.handleOperationRes(success)
        })
    }

    private updateMaterial(material: MaterialCore, id: number) {
        if (this.selectedFile) {
            this.materialService.uploadImage([this.selectedFile]).pipe(
                switchMap(imageUrl => {
                    return this.materialService.update({ ...material, image_url: imageUrl }, id);
                })
            ).subscribe(success => {
                this.updateState({ loadingSubmit: false });
                this.handleOperationRes(success);
            });
            return;
        }
        this.materialService.update(material, id).subscribe(success => {
            this.updateState({loadingSubmit: false})
            this.handleOperationRes(success)
        })
    }

    private getMaterial(id: number) {
        this.materialService.getById(id).subscribe(material => {
            if (this.hasGetError(material)) return;
            const m = material as MaterialI
            this.currentImageUrl = m.image_url ?? null;
            const formValue = {
                ...m,
                [MaterialForm.CATEGORY_IDS]: m.categories.map((c: any) => String(c.category_id)),
                [MaterialForm.DUE_DATE]: new Date(m.due_date)
            };

            this.form.reset(formValue);            
            this.updateState({loadingData: false, materialId: id})
        })
    }

    public onFileSelect(event: any) {
        this.selectedFile = event.files[0] ?? null;
    }
}
