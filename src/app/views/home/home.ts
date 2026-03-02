import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrimeNgModule } from '@prime-ng-module';

@Component({
    selector: 'app-home',
    imports: [PrimeNgModule, RouterLink],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export default class Home {
}
