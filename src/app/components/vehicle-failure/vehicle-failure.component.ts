import {Component, Input, OnInit} from '@angular/core';
import {UavInfo} from "../../model/uav-info";
import {SelectItem} from "primeng/api";
import {HttpService} from "../../services/http.service";
import {formatDate} from "@angular/common";
import {UavFailure} from "../../model/uav-failure";
import {Router} from "@angular/router";
import {UavFailureStep} from "../../model/uav-failure-step";


@Component({
  selector: 'app-vehicle-failure',
  templateUrl: './vehicle-failure.component.html',
  styleUrl: './vehicle-failure.component.css'
})
export class VehicleFailureComponent implements OnInit {

  @Input() uav!: UavInfo;

  allFailures: UavFailure[] = [];
  shallow: UavFailure[] = [];
  displayedFailures: UavFailure[] = [];

  severities!: SelectItem[];

  dialogVisible = false;
  message!: string;
  failureToDelete!: UavFailure;

  constructor(private httpService: HttpService, private router: Router) {}

  ngOnInit() {
    this.severities = [
      { label: 'Ошибка', value: 'ОШИБКА' },
      { label: 'Предупреждение', value: 'ПРЕДУПРЕЖДЕНИЕ' },
      { label: 'Замечание', value: 'ЗАМЕЧАНИЕ' },
      { label: 'Информация', value: 'ИНФОРМАЦИЯ' }
    ];
    if (this.uav !== null) {
      this.getFailures();
    }
  }

  private getFailures(): void {
    this.httpService.getUavFailures(this.uav.uavId).subscribe((data: UavFailure[]) => {
      data.forEach(f => {
        f.date = this.unixTimestampToDate(f.date);
        f.recordId = f.id;
      });
      this.allFailures = data;
      data.forEach(val => this.shallow.push(Object.assign({}, val)));
      this.displayedFailures = data;
      this.enumerateData(data);
    });
  }

  private enumerateData(arr: UavFailure[]): void {
    let counter = 0;
    arr.sort((a, b) =>
         this.convertStringToDate(a.date) < this.convertStringToDate(b.date) ? 1 : -1)
       .forEach(v => v.id = ++counter);
  }

  private unixTimestampToDate(unixTs: any): string {
    return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  }

  onFailureRowDoubleClick(rowData: any) {
    console.log(rowData);
    const id = rowData.id;
    if (id !== undefined) {
      this.router.navigate(['uav-failure-steps'],
        { skipLocationChange: true, state: {uavId: this.uav.uavId, failureData: rowData} }).then(() => "Ok");
    }
  }

  onRowEditInit(uavFailure: UavFailure) {
    //this.clonedFailures[uavFailure.id as number] = { ...uavFailure };
  }

  onRowEditSave(uavFailure: UavFailure) {
    uavFailure.uavId = this.uav.uavId;
    uavFailure.date = this.convertDateString(uavFailure.date);
    this.httpService.saveUavFailure(uavFailure).subscribe((data: UavFailure) => {
      if (data !== null) {
        this.getFailures();
      }
    });
  }

  onRowEditCancel(uavFailure: UavFailure, index: number) {
    const shallowFailure = this.shallow.find(f => f.recordId === uavFailure.recordId);
    if (shallowFailure) {
      this.allFailures[index] = shallowFailure;
      this.enumerateData(this.allFailures);
    }
  }

  onRowEditRemove(uavFailure: UavFailure) {
    this.failureToDelete = uavFailure;
    this.message = "Действительно удалить?";
    this.dialogVisible = true;
  }

  onConfirm() {
    this.dialogVisible = false;
    this.httpService.deleteUavFailure(this.failureToDelete).subscribe(() => {
      this.getFailures();
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

  getSeverity(status: string) {
    switch (status) {
      case 'ОШИБКА':
        return 'danger';
      case 'ПРЕДУПРЕЖДЕНИЕ':
        return 'warn';
      case 'ИНФОРМАЦИЯ':
        return 'success';
      case 'ЗАМЕЧАНИЕ':
      default:
        return 'info';
    }
  }

  onAdd() {
    let addFailure: UavFailure = {
      id: -1, // will be assigned by DB
      recordId: -1,
      uavId: this.uav.uavId,
      date: '',
      severity: 'ИНФОРМАЦИЯ',
      description: ''
    };
    this.allFailures.unshift(addFailure);
    this.enumerateData(this.allFailures);
  }

  // onSave(uavFailure: UavFailure) {
  //   this.httpService.saveUavFailure(uavFailure).subscribe((data: UavFailure) => {
  //     // this.allFailures = data;
  //     // this.message = "Изменения сохранены";
  //     // if (this.httpService.errorMessage !== '') {
  //     //   this.message = this.httpService.errorMessage;
  //     // }
  //     // this.feedbackVisible = true;
  //     // this.backUpData();
  //   });
  // }

  applyFilter(event: Event): void {
    this.enumerateData(this.allFailures);
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length == 0) {
      this.displayedFailures = this.allFailures;
      return;
    }
    let filteredFailures: UavFailure[] = [];
    for (let f of this.allFailures) {
      if (this.containsFilterVal(f, filterValue)) {
        filteredFailures.push(f as UavFailure);
      }
    }
    this.enumerateData(filteredFailures);
    this.displayedFailures = filteredFailures;
  }

  private containsFilterVal(f: UavFailure, val: string): boolean {
    return f.date.includes(val) || f.severity.includes(val) || f.description.includes(val);
  }

}
