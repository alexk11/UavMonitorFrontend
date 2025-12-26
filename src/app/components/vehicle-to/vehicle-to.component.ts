import {Component, Input, OnInit} from '@angular/core';
import {MessageService, SelectItem} from "primeng/api";
import {UavInfo} from "../../model/uav-info";
import {HttpService} from "../../services/http.service";
import {UavTO} from "../../model/uav-to";
import {formatDate} from "@angular/common";


@Component({
  selector: 'app-vehicle-to',
  templateUrl: './vehicle-to.component.html',
  styleUrl: './vehicle-to.component.css',
  providers: [MessageService]
})
export class VehicleToComponent implements OnInit {

  @Input() uav!: UavInfo;

  states!: SelectItem[];

  allTOs: UavTO[] = [];
  displayedTOs: UavTO[] = [];
  shallow: UavTO[] = []; //{ [s: string]: UavTO } = {};

  date!: Date;
  //progressbarInterval: number = 0

  first = 0;
  rows = 10;

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.states = [
      { label: 'Запланировано', value: 'ЗАПЛАНИРОВАНО' },
      { label: 'Выполнено', value: 'ВЫПОЛНЕНО' },
      { label: 'Замечания', value: 'ЗАМЕЧАНИЯ' },
      //{ label: 'Ошибки', value: 'ОШИБКИ' },
      { label: 'Неизвестно', value: 'НЕИЗВЕСТНО' }
    ];
    if (this.uav !== null) {
      this.getTOInfo();
    }
  }

  private getTOInfo(): void {
    this.httpService.getUavTOs(this.uav.uavId).subscribe((data: UavTO[]) => {
      data.forEach(to => {
        to.inspectionDate = this.unixTimestampToDate(to.inspectionDate);
        to.recordId = to.id;
      });
      this.allTOs = data;
      this.displayedTOs = data;
      data.forEach(val => this.shallow.push(Object.assign({}, val)));
      this.enumerateTOs(this.allTOs);
      //this.getProgressBarInterval();
    });
  }

  // private getProgressBarInterval(): void {
  //   let now = new Date();
  //   let differenceInMs = 0;
  //   let differenceInDays: number[] = [];
  //   const millisecondsInDay = 1000 * 60 * 60 * 24;
  //   this.allTOs.forEach(to => {
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

  private enumerateTOs(arr: UavTO[]) {
    let counter = 0;
    arr
      .sort((a, b) =>
        this.convertStringToDate(a.inspectionDate) < this.convertStringToDate(b.inspectionDate) ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  private unixTimestampToDate(unixTs: any): string {
    return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  }

  ///////////////

  onRowEditInit(uavTO: UavTO) {
    //this.clonedTOs[uavTO.id as number] = { ...uavTO };
  }

  onRowEditSave(uavTO: UavTO) {
    uavTO.uavId = this.uav.uavId;
    uavTO.inspectionDate = this.convertDateString(uavTO.inspectionDate);
    this.httpService.saveUavTO(uavTO).subscribe((data: UavTO) => {
      if (data !== null) {
        this.getTOInfo();
      }
    });
  }

  private convertDateString(dateStr: string): string {
    let arr = dateStr.split('.');
    return arr[2] + '-' + arr[1] + '-' + arr[0];
  }

  private convertStringToDate(dateStr: string): Date {
    let d = dateStr.split(".");
    return new Date(d[2] + '/' + d[1] + '/' + d[0]);
  }

  onRowEditCancel(uavTO: UavTO, index: number) {
    const shallowTO = this.shallow.find(to => to.recordId === uavTO.recordId);
    if (shallowTO) {
      this.allTOs[index] = shallowTO;
      this.enumerateTOs(this.allTOs)
    }
  }

  onRowRemove(uavTO: UavTO, index: number) {
    uavTO.uavId = this.uav.uavId;
    uavTO.inspectionDate = this.convertDateString(uavTO.inspectionDate);
    this.httpService.deleteUavTO(uavTO).subscribe(() => {
      this.getTOInfo();
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
    let addTO: UavTO = {
      id: -1, // will be assigned by DB
      recordId: -1,
      uavId: this.uav.uavId,
      inspectionDate: '',
      status: 'ЗАПЛАНИРОВАНО',
      note: ''
    };
    this.allTOs.unshift(addTO);
    this.enumerateTOs(this.allTOs);
    //this.shallow = {...this.allTOs };
    //this.onRowEditSave(addTO);
  }

  onReset() {
    this.allTOs = {... this.shallow };
  }

  // getBarColor(): string {
  //   if (this.progressbarInterval < 30) {
  //     return '#A80000';
  //   } else if (this.progressbarInterval > 30 && this.progressbarInterval < 90) {
  //     return '#FF7F50';
  //   } else if (this.progressbarInterval > 90 && this.progressbarInterval < 180) {
  //     return '#F0E68C';
  //   }
  //   return '#7CFC00';
  // }

  // getDaysBeforeTO(): string {
  //   let msg = `Ближайшее ТО через ${this.progressbarInterval}`;
  //   let lastDigit = Math.abs(this.progressbarInterval % 10);
  //   if(lastDigit == 1) {
  //     msg += ' день';
  //   } else if(this.progressbarInterval > 10 && this.progressbarInterval < 20) {
  //     msg += ' дней';
  //   } else if(lastDigit > 1 && lastDigit < 5) {
  //     msg += ' дня';
  //   } else {
  //     msg += ' дней';
  //   }
  //   return msg;
  // }

  applyFilter(event: Event): void {
    this.enumerateTOs(this.allTOs);
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length == 0) {
      this.displayedTOs = this.allTOs;
      return;
    }
    let filteredRecords: UavTO[] = [];
    for (let t of this.allTOs) {
      if (this.containsFilterVal(t, filterValue)) {
        filteredRecords.push(t as UavTO);
      }
    }
    this.enumerateTOs(filteredRecords);
    this.displayedTOs = filteredRecords;
  }


  private containsFilterVal(t: UavTO, val: string): boolean {
    return t.inspectionDate.includes(val) ||
        t.status.includes(val) ||
        t.note.includes(val);
  }

}
