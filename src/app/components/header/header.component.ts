import { Component, Input } from '@angular/core';
import { ThemeService } from "../../services/theme.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() pageTitle!: string;
  @Input() logoSrc!: string;

  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getThemeIcon(): string {
    return this.themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon';
  }

  getThemeLabel(): string {
    return this.themeService.isDarkMode() ? 'Переключить на светлую тему' : 'Переключить на темную тему';
  }
}
