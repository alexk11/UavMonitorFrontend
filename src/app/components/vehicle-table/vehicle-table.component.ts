import {Component, OnInit} from '@angular/core';
import {HttpService} from "../../services/http.service";
import {Vehicle} from "../../model/vehicle";
import {Router} from "@angular/router";


@Component({
  selector: 'app-vehicle-table',
  templateUrl: './vehicle-table.component.html',
  styleUrl: './vehicle-table.component.css'
})
export class VehicleTableComponent implements OnInit {

  allVehicles: Vehicle[] = [];
  displayedVehicles: Vehicle[] = [];
  vehicleTypes: string[] = [];
  selectedType: string | null = null;

  selectedVehicles: Vehicle[] = [];
  message: string = 'Действительно удалить?';
  dialogVisible: boolean = false;

  cols = [
    { field: 'id', header: 'Id' },
    { field: 'type', header: 'Тип' },
    { field: 'vehicleId', header: '№ БВС' },
    { field: 'description', header: 'Описание' }
  ];

  first = 0;
  rows = 10;

  constructor(private httpService: HttpService, private router: Router) {}

  ngOnInit() {
    this.getVehicles();
  }

  private getVehicles(): void {
    this.httpService.getVehicles().subscribe(data => {
      this.enumerateVehicles(data);
      this.allVehicles = data;
      this.displayedVehicles = data;
      this.extractVehicleTypes();
    });
  }

  private extractVehicleTypes(): void {
    const uniqueTypes = new Set(this.allVehicles.map(v => v.type));
    this.vehicleTypes = Array.from(uniqueTypes).sort();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = this.allVehicles;

    if (this.selectedType) {
      filtered = filtered.filter(v => v.type === this.selectedType);
    }

    this.enumerateVehicles(filtered);
    this.displayedVehicles = filtered;
    this.first = 0;
  }

  private enumerateVehicles(vehicles: Vehicle[]): void {
    let counter = 0;
    vehicles
      .sort((a, b) => a.vehicleId > b.vehicleId ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    let filtered = this.allVehicles;

    if (this.selectedType) {
      filtered = filtered.filter(v => v.type === this.selectedType);
    }

    if (filterValue.length > 0) {
      let filteredVehicles: Vehicle[] = [];
      for (let v of filtered) {
        if (this.containsFilterVal(v, filterValue)) {
          filteredVehicles.push(v as Vehicle);
        }
      }
      filtered = filteredVehicles;
    }

    this.enumerateVehicles(filtered);
    this.displayedVehicles = filtered;
  }

  private containsFilterVal(v: Vehicle, val: string): boolean {
    return v.type.includes(val) || v.vehicleId.includes(val) || v.description.includes(val);
  }

  onUavRowDoubleClick(rowData: any): void {
    const id = rowData.vehicleId;
    if (id !== undefined) {
      this.router.navigate(['uav-card', id, '0'], { skipLocationChange: true}).then(() => "Ok");
    }
  }

  onDelete(): void {
    this.dialogVisible = true;
  }

  onConfirm() {
    if (this.selectedVehicles.length > 0) {
      this.deleteVehicles();
    } else {
      this.dialogVisible = false;
    }
  }

  private deleteVehicles(): void {
    this.httpService.deleteVehicles(this.selectedVehicles).subscribe(() => {
      this.getVehicles();
      this.message = this.httpService.errorMessage == '' ?
        (this.selectedVehicles.length == 1 ? 'БВС удален.' : 'БВС удалены.') : this.httpService.errorMessage;
      this.selectedVehicles = [];
    });
  }

  addVehicle() {
    this.router.navigate(['uav-add'], { skipLocationChange: true}).then(() => "Ok");
  }

  next() {
    this.first = this.first + this.rows;
  }

  prev() {
    this.first = this.first - this.rows;
  }

  reset() {
    this.first = 0;
  }

  pageChange(event: { first: number; rows: number; }) {
    this.first = event.first;
    this.rows = event.rows;
  }

  isLastPage(): boolean {
    return this.displayedVehicles ? this.first + this.rows >= this.displayedVehicles.length : true;
  }

  isFirstPage(): boolean {
    return this.displayedVehicles ? this.first === 0 : true;
  }

}
