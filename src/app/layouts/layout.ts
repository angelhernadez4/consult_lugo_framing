import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { PrimeNgModule } from '@prime-ng-module';

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, PrimeNgModule],
    templateUrl: './layout.html',
    styleUrl: './layout.scss',
})
export default class Layout implements OnInit{
    toolbarColor = '#073763';
    sectionTitle = ''
    private readonly router: Router = inject(Router)

    ngOnInit(): void {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.updateToolbarColor(event.url);
            }
        });

        this.updateToolbarColor(this.router.url);
    }

    updateToolbarColor(url: string): void {
        // Buscamos cuál de las palabras clave está presente en la URL
        const section = ['lumber', 'hardware', 'siding', 'quotes'].find(key => url.includes(`/${key}`));

        switch (section) {
            case 'lumber':
                this.toolbarColor = '#073763';
                this.sectionTitle = 'Lumber';
                break;
            case 'hardware':
                this.toolbarColor = '#783F04';
                this.sectionTitle = 'Hardware';
                break;
            case 'siding':
                this.toolbarColor = '#274E13';
                this.sectionTitle = 'Siding';
                break;
            case 'quotes':
                this.toolbarColor = '#626262';
                this.sectionTitle = 'Quotes'
                break;
            default:
                this.toolbarColor = '#626262';
                this.sectionTitle = 'Materials';
                break;
        }
    }
}
