// theme-init.service.ts
import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeInitService {
  constructor(private themeService: ThemeService) {}

  initialize(): Promise<void> {
    return new Promise((resolve) => {
      // Тема уже инициализирована в конструкторе ThemeService
      console.log('Тема приложения инициализирована:', this.themeService.getCurrentTheme());
      resolve();
    });
  }
}
