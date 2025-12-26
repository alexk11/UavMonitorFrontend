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
  displayedRecords: UavEngine[] = [];
  shallow: UavEngine[] = [];

  date!: Date;

  first = 0;
  rows = 10;
  editMode: boolean = false;

  minutesTillNearestEngineTO: number = 0; //
  timeTillNearestEngineTO: string = ''; // in format hh, min

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    if (this.uav !== null) {
      this.getEngineData();
    }
  }

  private getEngineData(): void {
    this.httpService.getUavEngineInfo(this.uav.uavId).subscribe((data: UavEngine[]) => {
      this.allRecords = data;
      this.displayedRecords = data;
      data.forEach(val => {
        val.engineActiveFrom = this.formatDateCustom(val.engineActiveFrom);
        val.engineActiveTill = this.formatDateCustom(val.engineActiveTill);
        val.reportedTimestamp = this.formatDateCustom(val.reportedTimestamp);
        this.shallow.push(Object.assign({}, val))
      });
      this.enumerateEngineIntervals(this.allRecords);
      this.timeTillNearestEngineTO = this.calculateTimeTillTO(data);
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
    return hh + ' ч ' + (mm < 10 ? '0' + mm : mm) + ' мин';
  }

  private convertToDuration(durationStr: string): number {
    const tokens = durationStr.split(' ');
    return parseInt(tokens[0], 10)*60 + parseInt(tokens[2], 10);
  }

  private formatDateCustom(input: string): string {
    //input example = "11.10.2015 10:00";
    const [datePart, timePart] = input.split(" ");
    let [dd, mm, yy] = datePart.split(".");
    let [hh, mn] = timePart.split(":");

    yy = String(Number(yy) % 100);
    // Pad with leading zeros if single digit
    dd = dd.padStart(2, '0');
    mm = mm.padStart(2, '0');
    yy = yy.padStart(2, '0');

    return `${dd}.${mm}.${yy} ${hh}:${mn}`;
  }

  private enumerateEngineIntervals(arr: UavEngine[]): void {
    let counter = 0;
    arr
      .sort((a, b) =>
          this.convertStringToDate(a.engineActiveFrom) < this.convertStringToDate(b.engineActiveFrom) ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  applyFilter(event: Event): void {
    this.enumerateEngineIntervals(this.allRecords);
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length == 0) {
      this.displayedRecords = this.allRecords;
      return;
    }
    let filteredRecords: UavEngine[] = [];
    for (let r of this.allRecords) {
      if (this.containsFilterVal(r, filterValue)) {
        filteredRecords.push(r as UavEngine);
      }
    }
    this.enumerateEngineIntervals(filteredRecords);
    this.displayedRecords = filteredRecords;
  }

  private containsFilterVal(r: UavEngine, val: string): boolean {
    return r.engineActiveFrom.includes(val) ||
        r.engineActiveTill.includes(val) ||
        r.engineOperateDuration.includes(val) ||
        r.reporter.includes(val) ||
        r.reportedTimestamp.includes(val) ||
        r.note.includes(val);
  }

  // private unixTimestampToDate(unixTs: any): string {
  //   return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  // }

  onRowEditSave(uavEngine: UavEngine) {
    uavEngine.uavId = this.uav.uavId;
    uavEngine.engineOperateDuration = this.calculateInterval(uavEngine.engineActiveFrom, uavEngine.engineActiveTill);
    uavEngine.reporter = this.httpService.getUserName();
    uavEngine.reportedTimestamp = formatDate(new Date(), 'dd.MM.yy HH:mm', 'en-US'); //this.toIsoDateString(formatDate(new Date(), 'yyyy-MM-dd HH:mm', 'en-US'));
    this.httpService.saveUavEngineInfo(uavEngine).subscribe((data: UavEngine) => {
      if (data !== null) {
        this.getEngineData();
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
    } else if (this.minutesTillNearestEngineTO < 600) {
      return 'status-critical';
    } else if (this.minutesTillNearestEngineTO >= 600 && this.minutesTillNearestEngineTO < 1800) {
      return 'status-warning';
    } else if (this.minutesTillNearestEngineTO >= 1800 && this.minutesTillNearestEngineTO < 2400) {
      return 'status-attention';
    }
    return 'status-good';
  }

  getTimeLeftText(): string {
    return this.timeTillNearestEngineTO;
  }

  engineTOHint(): string {
    return "Интервал до технического обсуживания двигателя рассчитывается по формуле: \n" +
        "1-е ТО после 50 часов работы, \n" +
        "2-е ТО после следующих 50 часов (в сумме 100 часов). \n" +
        "Последующие ТО проводятся через каждые 100 часов работы двигателя."
  }

  onRowEditInit(uavEngine: UavEngine) {
    //this.clonedFailures[uavFailure.id as number] = { ...uavFailure };
  }

  onRowEditCancel(uavEngine: UavEngine, index: number) {
    const shallowEngineInfo = this.shallow.find(to => to.recordId === uavEngine.recordId);
    if (shallowEngineInfo) {
      this.allRecords[index] = shallowEngineInfo;
      this.enumerateEngineIntervals(this.allRecords)
    }
  }

  onRowRemove(uavEngine: UavEngine, index: number) {
    uavEngine.uavId = this.uav.uavId;
    //uavEngine.inspectionDate = this.convertDateString(uavEngine.inspectionDate);
    this.httpService.deleteUavEngineInfo(uavEngine).subscribe(() => {
      this.getEngineData();
    });
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
    this.enumerateEngineIntervals(this.allRecords);
    //this.shallow = {...this.allTOs };
    //this.onRowEditSave(addTO);
  }

  onReset() {
    this.allRecords = {... this.shallow };
  }

}
