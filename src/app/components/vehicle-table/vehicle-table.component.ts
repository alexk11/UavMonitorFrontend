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

  selectedVehicles: Vehicle[] = [];
  message: string = 'Действительно удалить?';
  dialogVisible: boolean = false;

  // Type filter
  selectedType: string | null = null;
  vehicleTypes: { label: string; value: string | null }[] = [];
  currentSearchValue: string = '';

  // Description editor
  editDialogVisible: boolean = false;
  editingVehicle: Vehicle | null = null;
  editedDescription: string = '';

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
    const uniqueTypes = [...new Set(this.allVehicles.map(v => v.type))];
    this.vehicleTypes = [
      { label: 'Все типы', value: null },
      ...uniqueTypes.map(type => ({ label: type, value: type }))
    ];
  }

  private enumerateVehicles(vehicles: Vehicle[]): void {
    let counter = 0;
    vehicles
      .sort((a, b) => a.vehicleId > b.vehicleId ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  applyFilter(event: Event): void {
    this.currentSearchValue = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  applyTypeFilter(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    this.enumerateVehicles(this.allVehicles);
    let filteredVehicles = this.allVehicles;

    // Apply type filter
    if (this.selectedType) {
      filteredVehicles = filteredVehicles.filter(v => v.type === this.selectedType);
    }

    // Apply search filter
    if (this.currentSearchValue.length > 0) {
      filteredVehicles = filteredVehicles.filter(v =>
        this.containsFilterVal(v, this.currentSearchValue)
      );
    }

    this.enumerateVehicles(filteredVehicles);
    this.displayedVehicles = filteredVehicles;
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

  onDescriptionEdit(vehicle: Vehicle): void {
    this.httpService.updateVehicle(vehicle).subscribe(() => {
      // Vehicle updated successfully
      console.log('Vehicle description updated');
    });
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
