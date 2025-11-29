import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from '../components/user-list/user-list.component';
import {VehicleTableComponent} from "../components/vehicle-table/vehicle-table.component";
import {VehicleCardComponent} from "../components/vehicle-card/vehicle-card.component";
import {UserCardComponent} from "../components/user-card/user-card.component";
import {AddUserComponent} from "../components/add-user/add-user.component";
import {AddVehicleComponent} from "../components/add-vehicle/add-vehicle.component";
import {FailureHistoryComponent} from "../components/failure-history/failure-history.component";
import {ContentComponent} from "../components/content/content.component";


const routes: Routes = [
  { path: 'content', component: ContentComponent },
  { path: 'uav-table', component: VehicleTableComponent },
  { path: 'uav-card/:id/:tab', component: VehicleCardComponent },
  { path: 'uav-add', component: AddVehicleComponent },
  { path: 'uav-failure-steps', component: FailureHistoryComponent },
  { path: 'users', component: UserListComponent },
  { path: 'user-add', component: AddUserComponent },
  { path: 'user-card/:login', component: UserCardComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
