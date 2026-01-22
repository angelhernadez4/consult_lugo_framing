import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNgModule } from '@prime-ng-module';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, PrimeNgModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export default class Layout {

}
