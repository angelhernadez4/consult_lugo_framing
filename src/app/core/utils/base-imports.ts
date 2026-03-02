import { PrimeNgModule } from 'src/app/prime-ng/prime-ng-module'
import { SharedModule } from '@shared/shared-module'
import { RouterLink } from '@angular/router'
import { ReactiveFormsModule } from '@angular/forms';

export const LIST_IMPORTS = [PrimeNgModule, SharedModule, RouterLink]

export const DETAIL_IMPORTS = [...LIST_IMPORTS];

export const OPERATIONAL_IMPORTS = [...LIST_IMPORTS, ReactiveFormsModule];
