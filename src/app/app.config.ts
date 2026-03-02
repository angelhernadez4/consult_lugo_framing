import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import MyPreset from '../mypreset';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    ConfirmationService,
    MessageService,
    providePrimeNG({
        theme: {
            preset: MyPreset
        }
    }),
    provideRouter(routes),
  ]
};
