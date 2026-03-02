import { Routes } from "@angular/router";
import { FragmentsRoutes } from "@core/utils";

export const materialsRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('@views/materials/pages/material-list/material-list')
    },
    {
        path: FragmentsRoutes.CREATE,
        loadComponent: () => import('@views/materials/pages/material/material')
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