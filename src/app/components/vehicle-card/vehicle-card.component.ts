import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {formatDate} from '@angular/common';
import {HttpService} from "../../services/http.service";
import {UavInfo} from "../../model/uav-info";

@Component({
  selector: 'app-vehicle-card',
  templateUrl: './vehicle-card.component.html',
  styleUrl: './vehicle-card.component.css'
})
export class VehicleCardComponent implements OnInit {

  uavId: string = '';
  value: number = 0;
  uavInfo!: UavInfo;
  shallow!: UavInfo;
  isEditable: boolean = false;

  activeTab: string = "0";

  message!: string;
  dialogVisible: boolean = false;

  insuranceForm!: FormGroup;
  insuranceSubmitted: boolean = false;
  daysBeforeExpiration: number | null = null;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private httpService: HttpService,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.uavId = params['id'];
      this.activeTab = params['tab'];
    });
    if (this.uavId != '') {
      this.getVehicleInfo();
    }
    this.initInsuranceForm();
  }

  private getVehicleInfo(): void {
    this.httpService.getUavInfo(this.uavId).subscribe(data => {
      if (data === undefined || data === null) {
        this.uavInfo = { id: 0,
                         uavId: this.uavId,
                         infoList: [],
                         slgAddTs: undefined,
                         evalActTs: undefined,
                         insuranceTs: undefined };
      } else {
        this.uavInfo = data;
      }
      this.backUpData();
      this.initInsuranceForm();
      this.calculateDaysBeforeExpiration();
    });
  }

  private backUpData(): void {
    this.shallow = {...this.uavInfo};
    if (this.uavInfo.infoList != null) {
      this.shallow.infoList = [...this.uavInfo.infoList];
    }
  }

  onEdit() {
    this.isEditable = !this.isEditable; // depends on role
    // if (this.isEditable) {
    //   const info: HTMLLIElement | null = document.querySelector('.uav-info li');
    //   if (info) {
    //     info.click();
    //   }
    // }
  }

  onReset() {
    this.uavInfo.infoList = this.shallow.infoList;
  }

  onBack() {
    this.router.navigate(['uav-table'], { skipLocationChange: true }).then(() => "Ok");
  }

  onSave() {
    if (this.notModified()) {
      return;
    }
    this.uavInfo.infoList = this.getCurrentData();
    this.httpService.postUavInfo(this.uavInfo).subscribe(data => {
      this.uavInfo = data;
      if (this.httpService.errorMessage !== '') {
        this.message = this.httpService.errorMessage;
      } else {
        this.message = "Изменения сохранены";
      }
      this.dialogVisible = true;
      this.backUpData();
    });
  }

  private getCurrentData(): string[] {
    let result: string[] = [];
    const parent = document.querySelector('.uav-info');
    const infoList = parent?.children;
    if (infoList !== undefined) {
      for (let i = 0; i < infoList.length; i++) {
        const li = infoList[i] as HTMLElement;
        if (li.textContent != null) {
          result.push(li.textContent);
        }
      }
    }
    return result;
  }

  onAddRow() {
    if (this.uavInfo.infoList == null) {
      this.uavInfo.infoList = [];
      this.shallow.infoList = [];
    }
    this.uavInfo.infoList.push("Новая информация");
    //console.log("shallow: " + this.shallow.data);
    //console.log("uavInfo: " + this.uavInfo.data);
  }

  onRemoveRow() {
    this.uavInfo.infoList.pop();
    //console.log("shallow" + this.shallow.data);
    //console.log("uavInfo: " + this.uavInfo.data);
  }

  mode(): string {
    return this.isEditable ? "Режим редактирования" : "Режим чтения";
  }

  private notModified(): boolean {
    const currentData = this.getCurrentData();
    return currentData.length === this.shallow.infoList.length &&
      currentData.every(
        (value, index) => value === this.shallow.infoList[index]
      );
  }

  private initInsuranceForm(): void {
    this.insuranceForm = this.formBuilder.group({
      expirationDate: [this.formatInsuranceDate(), Validators.required]
    });
  }

  private formatInsuranceDate(): string {
    if (this.uavInfo && this.uavInfo.insuranceTs) {
      return formatDate(new Date(this.uavInfo.insuranceTs), 'dd.MM.yyyy', 'en-US');
    }
    return '';
  }

  get insuranceFormControls() {
    return this.insuranceForm.controls;
  }

  onSaveInsurance(): void {
    this.insuranceSubmitted = true;

    if (this.insuranceForm.invalid) {
      return;
    }

    const dateStr = this.insuranceForm.get('expirationDate')?.value;
    if (dateStr) {
      const convertedDate = this.convertDateString(dateStr);
      this.uavInfo.insuranceTs = new Date(convertedDate);

      this.httpService.postUavInfo(this.uavInfo).subscribe({
        next: () => {
          this.calculateDaysBeforeExpiration();
          this.insuranceSubmitted = false;
          this.message = "Дата страхования сохранена";
          this.dialogVisible = true;
          this.backUpData();
        },
        error: (err) => {
          console.error('Error saving insurance date:', err);
          this.message = "Ошибка при сохранении даты страхования";
          this.dialogVisible = true;
        }
      });
    }
  }

  private convertDateString(dateStr: string): string {
    const parts = dateStr.split('.');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  private calculateDaysBeforeExpiration(): void {
    if (this.uavInfo && this.uavInfo.insuranceTs) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expirationDate = new Date(this.uavInfo.insuranceTs);
      expirationDate.setHours(0, 0, 0, 0);
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.daysBeforeExpiration = diffDays;
    } else {
      this.daysBeforeExpiration = null;
    }
  }

}
