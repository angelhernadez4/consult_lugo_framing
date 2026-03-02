import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment as ENV } from '@environments/environments';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GdataService {
    private readonly BASE_URL: string = `${ENV.api.url}`
    private readonly http: HttpClient = inject(HttpClient)

    getAllLumber() {
        return this.http.get<any[]>(`${this.BASE_URL}?type=lumber`);
    }

    getAllHardware() {
        return this.http.get<any[]>(`${this.BASE_URL}?type=hardware`);
    }

    getAllSiding() {
        return this.http.get<any[]>(`${this.BASE_URL}?type=siding`);
    }
}
