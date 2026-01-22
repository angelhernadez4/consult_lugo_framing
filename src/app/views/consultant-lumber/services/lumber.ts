import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment as ENV } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class LumberService {
    private readonly BASE_URL: string = `${ENV.api.url}`
    private readonly http: HttpClient = inject(HttpClient)

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(this.BASE_URL);
    }
}
