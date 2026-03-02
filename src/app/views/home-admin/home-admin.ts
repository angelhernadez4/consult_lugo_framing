import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrimeNgModule } from '@prime-ng-module';

@Component({
  selector: 'app-home-admin',
  imports: [PrimeNgModule, RouterLink],
  templateUrl: './home-admin.html',
  styleUrl: './home-admin.scss',
})
export default class HomeAdmin {

}
