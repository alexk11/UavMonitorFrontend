import {APP_INITIALIZER, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './modules/app-routing.module';
import {AppPrimengModule} from "./modules/app-primeng-module";
import {AppCoreUIModule} from "./modules/app-core-ui-module";

import { AppComponent } from './app.component';
import { MessagesComponent } from './components/messages/messages.component';
import { UserListComponent } from "./components/user-list/user-list.component";
import {HeaderComponent} from "./components/header/header.component";
import {LoginFormComponent} from "./components/login-form/login-form.component";
import {ContentComponent} from "./components/content/content.component";
import {NavBarComponent} from "./components/nav-bar/nav-bar.component";
import {VehicleTableComponent} from "./components/vehicle-table/vehicle-table.component";
import {VehicleCardComponent} from "./components/vehicle-card/vehicle-card.component";
import {UserCardComponent} from "./components/user-card/user-card.component";
import {AddUserComponent} from "./components/add-user/add-user.component";
import {FooterComponent} from "./components/footer/footer.component";

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import {DropdownModule} from "primeng/dropdown";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {AppConfigService} from "./services/config.service";
import {PdfViewerComponent} from "./components/pdf-viewer/pdf-viewer.component";
import {ImageGalleryComponent} from "./components/image-gallery/image-gallery.component";
import {AddVehicleComponent} from "./components/add-vehicle/add-vehicle.component";
import {ActivityComponent} from "./components/activity/activity.component";
import {VehicleToComponent} from "./components/vehicle-to/vehicle-to.component";
import {InfoDialogComponent} from "./components/info-dialog/info-dialog.component";
import {VehicleFailureComponent} from "./components/vehicle-failure/vehicle-failure.component";
import {FailureHistoryComponent} from "./components/failure-history/failure-history.component";

// Добавляем импорт сервисов темы
import { ThemeService } from './services/theme.service';
import { ThemeInitService } from './services/theme-init.service';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    AppPrimengModule,
    AppCoreUIModule,
    DropdownModule,
    NgbModule,
  ],
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginFormComponent,
    NavBarComponent,
    ContentComponent,
    MessagesComponent,
    UserListComponent,
    VehicleTableComponent,
    VehicleCardComponent,
    AddVehicleComponent,
    UserCardComponent,
    AddUserComponent,
    FooterComponent,
    PdfViewerComponent,
    ImageGalleryComponent,
    ActivityComponent,
    VehicleToComponent,
    VehicleFailureComponent,
    FailureHistoryComponent,
    InfoDialogComponent
  ],
  bootstrap: [ AppComponent ],
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-theme',
          cssLayer: false
        }
      },
    }),
    AppConfigService,
    ThemeService,
    ThemeInitService,
    {
      provide: APP_INITIALIZER,
      useFactory: (appConfigService: AppConfigService) => () => appConfigService.initialize(),
      deps: [AppConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (themeInitService: ThemeInitService) => () => themeInitService.initialize(),
      deps: [ThemeInitService],
      multi: true
    }
  ]
})
export class AppModule {}
