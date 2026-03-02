import { inject, Injectable } from '@angular/core';
import { BaseService } from '@core/abstracts/base';
import { ErrorsMap, GenericBackendResponse, GetAllObs, GetOneObs, SuccessObs } from '@core/interfaces';
import { NotificationService } from '@core/services/notification';
import { Material, MaterialCore } from '../interfaces';
import { catchError, map, of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { CloudinaryResponse } from '../interfaces/material';


@Injectable({
    providedIn: 'root',
})
export class MaterialService extends BaseService {
    private readonly notificationService: NotificationService = inject(NotificationService)

    constructor() {
        super({
            baseRoute: 'consultant/materials',
            baseEndpoint: 'materials',
            singularName: 'material',
        })
    }

    public getAll() : GetAllObs<Material> {
        const url: string = `${this.BASE_URL}`
        return this.http.get<{ success: boolean; message: string; material: Material[] }>(url).pipe(
            map(res => res.material),
            catchError(() => of(null))
        )
    }

    public getById(id: number) : GetOneObs<Material> {
        const url: string = `${this.BASE_URL}/${id}`;
        return this.http.get<{ success: boolean; material: Material }>(url).pipe(
            map(res => !res.material ? ErrorsMap.ELEMET_NOT_EXIST : res.material),
            catchError(() => of(null))
        )
    }

    public getMaterialByCategory(categories: string[]) : GetAllObs<Material> {
        const url: string = `${this.BASE_URL}/by-category`;        
        let params = new HttpParams();
        categories.forEach(category => {
            params = params.append('category', category)
        })
        return this.http.get<{ success: boolean; material: Material[] }>(url, { params }).pipe(
            map(res => res.material),
            catchError(() => of(null))
        )
    }

    public create(material: MaterialCore) : SuccessObs {
        const url: string = `${this.BASE_URL}`
        return this.http.post<GenericBackendResponse>(url, material).pipe(
            map(res => res.success),
            catchError(err => {
                this.notificationService.error(err.error.message, false)
                return of(false)
            })
        )
    }

    public update(material: MaterialCore, id: number) : SuccessObs {
        const url: string = `${this.BASE_URL}/${id}`;
        return this.http.patch<GenericBackendResponse>(url, material).pipe(
            map(res => res.success),
            catchError(err => {
                this.notificationService.error(err.error.message, false)
                return of(false)
            })
        )
    }

    public delete(id: number) : SuccessObs {
        const url: string = `${this.BASE_URL}/${id}`
        return this.http.delete<GenericBackendResponse>(url).pipe(
            map(res => res.success),
            catchError(err => {
                this.notificationService.error(err.error.message, false)
                return of(false)
            })
        )
    }

    public uploadImage(files: File[]) {
        const url: string = `${this.BASE_URL}/upload-image`
        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file)
        })
        return this.http.post<CloudinaryResponse>(url, formData).pipe(
            map(res => res.secure_url)
        )
    }
}
