import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../services/http.service";
import {Router} from "@angular/router";
import {Vehicle} from "../../model/vehicle";


interface UavType {
  name: string,
  code: number
}

@Component({
  selector: 'app-add-vehicle',
  templateUrl: './add-vehicle.component.html',
  styleUrls: ['./add-vehicle.component.css']
})
export class AddVehicleComponent implements OnInit {

  uavCreateForm!: FormGroup;
  submitted = false;

  dialogVisible: boolean = false;
  message: string = "";
  required: string = 'Обязательное поле';

  types: UavType[] = [
    {name: 'VT-30', code: 1},
    {name: 'VT-45', code: 2},
    {name: 'VT-440', code: 3},
    {name: 'VT-550', code: 4}
  ];

  constructor(private formBuilder: FormBuilder,
              private httpService: HttpService,
              private router: Router) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.uavCreateForm = this.formBuilder.group(
      {
        type: ['', Validators.required],
        vehicleId: ['', Validators.required],
        description: ['', Validators.min(0)]
      },
    );
  }

  get f() {
    return this.uavCreateForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.uavCreateForm.invalid) {
      return;
    }
    const vehicle: Vehicle = this.createVehicle();
    this.httpService.addVehicle(vehicle)
      .subscribe({
        next: () => {
          this.message = `БВС '${vehicle.vehicleId}' добавлен`;
          if (this.httpService.errorMessage !== '') {
            this.message = this.httpService.errorMessage;
          }
        },
        error: (error: string) => this.message = error,
        complete: () => this.dialogVisible = true
      });
  }

  onReset() {
    this.submitted = false;
    this.uavCreateForm.reset();
  }

  onConfirm() {
    this.dialogVisible = false;
    this.router.navigate(['uav-table'], {skipLocationChange: true}).then(() => "Ok");
  }

  onBack() {
    this.router.navigate(['uav-table'], {skipLocationChange: true}).then(() => "Ok");
  }

  private createVehicle() {
    const fc = this.f;
    return {
      id: -1, // will be assigned by DB
      type: fc.type.value.name,
      vehicleId: fc.vehicleId.value,
      description: fc.description.value
    };
  }

}
