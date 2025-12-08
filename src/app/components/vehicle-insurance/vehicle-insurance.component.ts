import {Component, Input, OnInit} from '@angular/core';
import {UavInfo} from "../../model/uav-info";
import {HttpService} from "../../services/http.service";

@Component({
  selector: 'app-vehicle-insurance',
  templateUrl: './vehicle-insurance.component.html',
  styleUrl: './vehicle-insurance.component.css'
})
export class VehicleInsuranceComponent implements OnInit {

  @Input() uav!: UavInfo;

  insuranceDate: Date | undefined;
  daysLeft: number = 0;
  message: string = '';
  infoVisible: boolean = false;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    if (this.uav.insuranceTs) {
      this.insuranceDate = new Date(this.uav.insuranceTs);
    }
    this.calculateDaysLeft();
  }

  private calculateDaysLeft(): void {
    if (!this.insuranceDate) {
      this.daysLeft = -1;
      return;
    }

    const now = new Date();
    const expirationDate = new Date(this.insuranceDate);
    const differenceInMs = expirationDate.getTime() - now.getTime();
    const millisecondsInDay = 1000 * 60 * 60 * 24;
    this.daysLeft = Math.floor(differenceInMs / millisecondsInDay);
  }

  onDateChange(): void {
    this.calculateDaysLeft();
  }

  onSave(): void {
    if (!this.insuranceDate) {
      this.message = 'Пожалуйста, выберите дату';
      this.infoVisible = true;
      return;
    }

    this.uav.insuranceTs = this.insuranceDate;
    this.httpService.postUavInfo(this.uav).subscribe(() => {
      if (this.httpService.errorMessage !== '') {
        this.message = this.httpService.errorMessage;
      } else {
        this.message = 'Дата страхования сохранена';
        this.calculateDaysLeft();
      }
      this.infoVisible = true;
    });
  }

  getSeverityClass(): string {
    if (this.daysLeft < 0) {
      return 'status-expired';
    } else if (this.daysLeft < 30) {
      return 'status-critical';
    } else if (this.daysLeft >= 30 && this.daysLeft < 90) {
      return 'status-warning';
    } else if (this.daysLeft >= 90 && this.daysLeft < 180) {
      return 'status-attention';
    }
    return 'status-good';
  }

  getDaysLeftText(): string {
    if (this.daysLeft < 0) {
      const daysExpired = Math.abs(this.daysLeft);
      let msg = `Просрочено на ${daysExpired}`;
      let lastDigit = Math.abs(daysExpired % 10);
      if(lastDigit == 1 && daysExpired !== 11) {
        msg += ' день';
      } else if(daysExpired > 10 && daysExpired < 20) {
        msg += ' дней';
      } else if(lastDigit > 1 && lastDigit < 5) {
        msg += ' дня';
      } else {
        msg += ' дней';
      }
      return msg;
    }

    let msg = `${this.daysLeft}`;
    let lastDigit = Math.abs(this.daysLeft % 10);
    if(lastDigit == 1 && this.daysLeft !== 11) {
      msg += ' день';
    } else if(this.daysLeft > 10 && this.daysLeft < 20) {
      msg += ' дней';
    } else if(lastDigit > 1 && lastDigit < 5) {
      msg += ' дня';
    } else {
      msg += ' дней';
    }
    return msg + ' до истечения страховки';
  }

}
