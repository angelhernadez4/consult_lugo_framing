import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainButton } from './components/main-button/main-button';
import { Spinner } from './components/spinner/spinner';
import { PrimeNgModule } from '@prime-ng-module';



@NgModule({
  declarations: [MainButton, Spinner],
  imports: [
    CommonModule,
    PrimeNgModule
  ],
  exports: [
    MainButton,
    Spinner
  ]
})
export class SharedModule { }
