import {NgModule} from "@angular/core";
import {IconDirective} from "@coreui/icons-angular";
import {
  CollapseDirective,
  ContainerComponent,
  DropdownComponent,
  DropdownItemDirective,
  DropdownMenuDirective, DropdownToggleDirective, NavbarBrandDirective, NavbarComponent, NavbarNavComponent,
  NavbarTogglerDirective, NavItemComponent, NavLinkDirective
} from "@coreui/angular";


@NgModule({
  declarations: [],
  imports: [ CollapseDirective,
    ContainerComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective,
    NavbarBrandDirective,
    NavbarComponent,
    NavbarNavComponent,
    NavbarTogglerDirective, NavItemComponent, NavLinkDirective, IconDirective],
  exports: [ CollapseDirective,
    ContainerComponent, DropdownComponent, DropdownItemDirective, DropdownMenuDirective, DropdownToggleDirective,
    NavbarBrandDirective,
    NavbarComponent,
    NavbarNavComponent,
    NavbarTogglerDirective, NavItemComponent, NavLinkDirective, IconDirective]
})
export class AppCoreUIModule {}
