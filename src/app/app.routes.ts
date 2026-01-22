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
        ],
    }
];
