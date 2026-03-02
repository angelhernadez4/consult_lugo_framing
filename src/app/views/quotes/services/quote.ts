import { inject, Injectable } from "@angular/core";
import { BaseService } from "@core/abstracts/base";
import { GenericBackendResponse, GetAllObs, SuccessObs } from "@core/interfaces";
import { NotificationService } from "@core/services/notification";
import { Quote, QuoteCore } from "../interfaces/quote";
import { catchError, map, of } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class QuoteService extends BaseService {
    private readonly notificationService: NotificationService = inject(NotificationService)

    constructor() {
        super({
            baseRoute: 'consultant/quotes',
            baseEndpoint: 'quotes',
            singularName: 'quotes',
        })
    }

    public getAll() : GetAllObs<Quote> {
        const url: string = `${this.BASE_URL}`
        return this.http.get<{ success: boolean; quotes: Quote[] }>(url).pipe(
            map(res => res.quotes),
            catchError(() => of(null))
        )
    }

    public create(quote: QuoteCore) : SuccessObs {
        const url: string = `${this.BASE_URL}`
        return this.http.post<GenericBackendResponse>(url, quote).pipe(
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
}