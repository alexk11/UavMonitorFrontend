import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {Router} from "@angular/router";
import {DOCUMENT} from "@angular/common";
import {MenuItem} from "primeng/api";
import {AppConfigService} from "../../services/config.service";


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {

  @Input() username: string = '';
  @Output() logoutEvent = new EventEmitter();

  isDarkMode: boolean = false;
  items: MenuItem[] = [];

  userRole!: string;
  enabled: boolean = false;

  constructor(@Inject(DOCUMENT) private document: Document,
              private router: Router,
              private appConfig: AppConfigService) {
  }

  ngOnInit() {
    this.enabled = this.appConfig.getConfig().enabled;
    this.userRole = this.appConfig.getConfig().userRole;
    //this.primengConfig.ripple = true;
    this.items = [
      {
        label: this.username,
        items: [
          { separator: true },
          { label: "Профиль", icon: "pi pi-user-edit", command: () => { this.onProfile(); } },
          { label: "Выход", icon: "pi pi-sign-out", command: () => { this.onLogout(); } },
          //{ label: "Что-то еще", icon: "pi pi-cog", }
        ],
      },
    ];
  }

  isAdmin(): boolean {
    return this.userRole === "ADMIN";
  }

  onProfile() {
    this.router.navigate(['user-card', this.username], { skipLocationChange: true}).then(() => 'Ok');
  }

  onLogout() {
    this.logoutEvent.emit();
  }

  navigateToUAVs(): void {
    this.router.navigate(['uav-table'], { skipLocationChange: true }).then(() => 'Ok');
  }

  navigateToUsers(): void {
    this.router.navigate(['users'], { skipLocationChange: true }).then(() => "Ok");
  }

  toggleLightDark(): void {
    this.isDarkMode = !this.isDarkMode;

    const head = this.document.getElementsByTagName('head')[0];
    const themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
    const styleName = this.isDarkMode ? "dark" : "light";

    if (themeLink) {
      themeLink.href = `assets/themes/lara-${styleName}-blue/theme.css`;
    } else {
      const style = this.document.createElement('link');
      style.id = 'app-theme';
      style.rel = 'stylesheet';
      style.type = 'text/css';
      style.href = `assets/themes/lara-${styleName}-blue/theme.css`;

      head.appendChild(style);
    }
  }

}
