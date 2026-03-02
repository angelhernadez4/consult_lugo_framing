import { Routes } from "@angular/router";
import { FragmentsRoutes } from "@core/utils";

export const quotesRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('@views/quotes/pages/quote-list/quote-list')
    },
    {
        path: `${FragmentsRoutes.UPDATE}/:id`,
        loadComponent: () => import('@views/materials/pages/material/material')
    },
    {
        path: `${FragmentsRoutes.DETAIL}/:id`,
        loadComponent: () => import('@views/materials/pages/material-detail/material-detail')
    }
]