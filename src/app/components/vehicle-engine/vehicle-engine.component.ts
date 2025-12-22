import {Component, Input, OnInit} from '@angular/core';
import {UavInfo} from "../../model/uav-info";
import {UavEngine} from "../../model/uav-engine";
import {HttpService} from "../../services/http.service";
import {formatDate} from "@angular/common";

@Component({
  selector: 'app-vehicle-engine',
  templateUrl: './vehicle-engine.component.html',
  styleUrl: './vehicle-engine.component.css'
})
export class VehicleEngineComponent implements OnInit {

  @Input() uav!: UavInfo;

  allRecords: UavEngine[] = [];
  //displayedRecords: UavEngine[] = [];
  shallow: UavEngine[] = []; //{ [s: string]: UavEngine } = {};

  date!: Date;
  progressbarInterval: number = 0

  minutesTillNearestEngineTO: number = 0; //
  timeTillNearestEngineTO: string = ''; // in format hh, min

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    if (this.uav !== null) {
      this.getTOData();
    }
  }

  private getTOData(): void {
    this.httpService.getUavTOInfo(this.uav.uavId).subscribe((data: UavEngine[]) => {
      this.allRecords = data;
      data.forEach(val => this.shallow.push(Object.assign({}, val)));
      this.enumerateTOs();
      this.timeTillNearestEngineTO = this.calculateTimeTillTO(data);
      //this.getProgressBarInterval();
    });
  }

  private calculateTimeTillTO(data: UavEngine[]): string {
    let sum = 0;
    data.forEach(val => {
      sum += this.convertToDuration(val.engineOperateDuration);
    })
    if(sum <= 3000) {
      this.minutesTillNearestEngineTO = 3000 - sum;
      return this.toFormattedSpareDuration(3000 - sum);
    } else if (3000 < sum && sum <= 6000) {
      this.minutesTillNearestEngineTO = 6000 - sum;
      return this.toFormattedSpareDuration(6000 - sum);
    } else if (6000 < sum && sum <= 12000) {
      this.minutesTillNearestEngineTO = 12000 - sum;
      return this.toFormattedSpareDuration(12000 - sum);
    } else {
      const leftBound = Math.floor(sum / 6000);
      const rightBound = (leftBound + 1) * 6000;
      this.minutesTillNearestEngineTO = rightBound - sum;
      return this.toFormattedSpareDuration(rightBound - sum);
    }
  }

  private toFormattedSpareDuration(minutes: number): string {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return hh + ' ч, ' + (mm < 10 ? '0' + mm : mm) + ' мин';
  }

  private convertToDuration(durationStr: string): number {
    const tokens = durationStr.split(' ');
    return parseInt(tokens[0], 10)*60 + parseInt(tokens[2], 10);
  }

  // private getProgressBarInterval(): void {
  //   let now = new Date();
  //   let differenceInMs = 0;
  //   let differenceInDays: number[] = [];
  //   const millisecondsInDay = 1000 * 60 * 60 * 24;
  //   this.allRecords.forEach(to => {
  //     let toDate = this.convertStringToDate(to.inspectionDate);
  //     if (toDate > now) {
  //       differenceInMs = Math.abs(toDate.getTime() - now.getTime());
  //       differenceInDays.push(Math.floor(differenceInMs / millisecondsInDay));
  //     }
  //   });
  //   if (differenceInDays.length > 0) {
  //     this.progressbarInterval = Math.min(...differenceInDays); // nearest TO
  //   } else {
  //     this.progressbarInterval = - 1; // no info on upcoming TO
  //   }
  // }

  private enumerateTOs(): void {
    let counter = 0;
    this.allRecords
        .sort((a, b) =>
            this.convertStringToDate(a.engineActiveFrom) < this.convertStringToDate(b.engineActiveFrom) ? 1 : -1)
        .forEach(v => v.id = ++counter);
  }

  // private unixTimestampToDate(unixTs: any): string {
  //   return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  // }

  onRowEditSave(uavEngine: UavEngine) {
    uavEngine.uavId = this.uav.uavId;
    uavEngine.engineOperateDuration = this.calculateInterval(uavEngine.engineActiveFrom, uavEngine.engineActiveTill);
    uavEngine.reporter = this.httpService.getUserName();
    uavEngine.reportedTimestamp = formatDate(new Date(), 'dd.MM.yy HH:mm', 'en-US'); //this.toIsoDateString(formatDate(new Date(), 'yyyy-MM-dd HH:mm', 'en-US'));
    this.httpService.saveUavTOInfo(uavEngine).subscribe((data: UavEngine) => {
      if (data !== null) {
        this.getTOData();
      }
    });
  }

  private calculateInterval(startDate: string, endDate: string): string {
    const diffInMillis =
        Date.parse(this.toIsoDateString(endDate)) - Date.parse(this.toIsoDateString(startDate));
    const totalMinutes = Math.floor(diffInMillis / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} ч, ${minutes} мин`;
  }

  private toIsoDateString(dateStr: string): string {
    const arr = dateStr.split(' ');
    return this.convertDateString(arr[0]) + ' ' + arr[1];
  }

  private convertDateString(dateStr: string): string {
    let arr = dateStr.split('.');
    return arr[2] + '-' + arr[1] + '-' + arr[0];
  }

  private convertStringToDate(dateStr: string): Date {
    let d = dateStr.split(".");
    return new Date(d[2] + '/' + d[1] + '/' + d[0]);
  }

  getSeverityClass(): string {
    if (this.minutesTillNearestEngineTO === undefined || this.minutesTillNearestEngineTO < 0) {
      return 'status-warning';
    }
    if (this.minutesTillNearestEngineTO < 0) {
      return 'status-expired';
    } else if (this.minutesTillNearestEngineTO < 10) {
      return 'status-critical';
    } else if (this.minutesTillNearestEngineTO >= 10 && this.minutesTillNearestEngineTO < 30) {
      return 'status-warning';
    } else if (this.minutesTillNearestEngineTO >= 30 && this.minutesTillNearestEngineTO < 40) {
      return 'status-attention';
    }
    return 'status-good';
  }

  getTimeLeftText(): string {
    return 'До ближайшего ТО: ' + this.timeTillNearestEngineTO;
  }

  onRowEditInit(uavEngine: UavEngine) {
    //this.clonedFailures[uavFailure.id as number] = { ...uavFailure };
  }

  onRowEditCancel(uavEngine: UavEngine, index: number) {
    const shallowEngineInfo = this.shallow.find(to => to.recordId === uavEngine.recordId);
    if (shallowEngineInfo) {
      this.allRecords[index] = shallowEngineInfo;
      this.enumerateTOs()
    }
  }

  onRowRemove(uavEngine: UavEngine, index: number) {
    uavEngine.uavId = this.uav.uavId;
    //uavEngine.inspectionDate = this.convertDateString(uavEngine.inspectionDate);
    this.httpService.deleteUavTOInfo(uavEngine).subscribe(() => {
      this.getTOData();
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'ВЫПОЛНЕНО':
        return 'success';
      case 'ЗАМЕЧАНИЯ':
        return 'warn';
      case 'ОШИБКИ':
        return 'danger';
      case 'ЗАПЛАНИРОВАНО':
      case 'НЕИЗВЕСТНО':
      default:
        return 'info';
    }
  }

  onAdd() {
    let addTO: UavEngine = {
      id: -1, // will be assigned by DB
      recordId: -1,
      uavId: this.uav.uavId,
      engineOperateDuration: '0',
      engineActiveFrom: '',
      engineActiveTill: '',
      reporter: '',
      reportedTimestamp: '',
      note: ''
    };
    this.allRecords.unshift(addTO);
    this.enumerateTOs();
    //this.shallow = {...this.allTOs };
    //this.onRowEditSave(addTO);
  }

  onReset() {
    this.allRecords = {... this.shallow };
  }

  getBarColor(): string {
    if (this.progressbarInterval < 30) {
      return '#A80000';
    } else if (this.progressbarInterval > 30 && this.progressbarInterval < 90) {
      return '#FF7F50';
    } else if (this.progressbarInterval > 90 && this.progressbarInterval < 180) {
      return '#F0E68C';
    }
    return '#7CFC00';
  }

  getDaysBeforeTO(): string {
    let msg = `Ближайшее ТО через ${this.progressbarInterval}`;
    let lastDigit = Math.abs(this.progressbarInterval % 10);
    if(lastDigit == 1) {
      msg += ' день';
    } else if(this.progressbarInterval > 10 && this.progressbarInterval < 20) {
      msg += ' дней';
    } else if(lastDigit > 1 && lastDigit < 5) {
      msg += ' дня';
    } else {
      msg += ' дней';
    }
    return msg;
  }

}
