import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSort, MatSortHeader} from "@angular/material/sort";

@NgModule({
  declarations: [],
  imports: [ CommonModule, MatInputModule, MatTableModule, MatToolbarModule, MatPaginatorModule, MatSort, MatSortHeader],
  exports: [ CommonModule, MatInputModule, MatTableModule, MatToolbarModule, MatPaginatorModule, MatSort, MatSortHeader]
})
export class AppMaterialModule {}
