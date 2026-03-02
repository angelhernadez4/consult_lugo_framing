import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'start',
        pathMatch: 'full'
    },
    {
        path: 'start',
        loadComponent: () => import('@views/home/home')
    },
    {
        path: 'admin',
        loadComponent: () => import('@views/home-admin/home-admin')
    },
    {
        path: 'consultant',
        loadComponent: () => import('@layouts/layout'),
        children: [
            {
                path: 'lumber',
                loadComponent: () => import('@views/consultant-lumber/pages/consultant-lumber')
            },
            {
                path: 'hardware',
                loadComponent: () => import('@views/consultant-hardware/consultant-hardware')
            },
            {
                path: 'siding',
                loadComponent: () => import('@views/consultant-siding/consultant-siding')
            },
            {
                path: 'materials',
                loadChildren: () => import('@views/materials/materials.routes').then(r => r.materialsRoutes)
            },
            {
                path: 'quotes',
                loadChildren: () => import('@views/quotes/quotes.routes').then(r => r.quotesRoutes)
            }
        ],
    }
];
