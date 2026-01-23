import {Component, OnInit} from '@angular/core';
import {SelectItem} from "primeng/api";
import {HttpService} from "../../services/http.service";
import {formatDate} from "@angular/common";
import {UavFailure} from "../../model/uav-failure";
import {Router} from "@angular/router";
import {FailureCommon} from "../../model/failure-common";


@Component({
  selector: 'app-failure-common',
  templateUrl: './failure-common.component.html',
  styleUrl: './failure-common.component.css'
})
export class FailureCommonComponent implements OnInit {

  allFailures: FailureCommon[] = [];
  shallow: FailureCommon[] = [];
  displayedFailures: FailureCommon[] = [];

  uavIds: String[] = [];

  dialogVisible = false;
  message!: string;
  failureToDelete!: FailureCommon;

  constructor(private httpService: HttpService, private router: Router) {}

  ngOnInit() {
    this.getUavIds();
    this.getCommonFailures();
  }

  private getUavIds() {
    this.httpService.getRegNumbers().subscribe((data: String[]) => {
      this.uavIds = data;
    });
  }

  private getCommonFailures(): void {
    this.httpService.getFailuresCommon().subscribe((data: FailureCommon[]) => {
      data.forEach(f => {
        f.failureDate = this.unixTimestampToDate(f.failureDate);
        f.recordId = f.id;
      });
      this.allFailures = data;
      data.forEach(val => this.shallow.push(Object.assign({}, val)));
      this.displayedFailures = data;
      this.enumerateData(data);
    });
  }

  private enumerateData(arr: FailureCommon[]): void {
    let counter = 0;
    arr.sort((a, b) =>
        this.convertStringToDate(a.failureType) < this.convertStringToDate(b.failureType) ? 1 : -1)
        .forEach(v => v.id = ++counter);
  }

  private unixTimestampToDate(unixTs: any): string {
    return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  }

  // onFailureRowDoubleClick(rowData: any) {
  //   console.log(rowData);
  //   const id = rowData.id;
  //   if (id !== undefined) {
  //     this.router.navigate(['uav-failure-steps'],
  //       { skipLocationChange: true, state: {uavId: this.uav.uavId, failureData: rowData} }).then(() => "Ok");
  //   }
  // }

  onRowEditInit(uavFailure: UavFailure) {
    //this.clonedFailures[uavFailure.id as number] = { ...uavFailure };
  }

  onRowEditSave(failureCommon: FailureCommon) {
    failureCommon.failureDate = this.convertDateString(failureCommon.failureDate);
    failureCommon.reportedTs = formatDate(new Date(), "yyyy-MM-dd'T'HH:mm", 'en-US');
    if (failureCommon.contactPerson === '') {
      failureCommon.contactPerson = this.httpService.getUserName();
    }
    this.httpService.saveFailureCommon(failureCommon).subscribe((data: FailureCommon) => {
      if (data !== null) {
        this.getCommonFailures();
      }
    });
  }

  onRowEditCancel(failureCommon: FailureCommon, index: number) {
    const shallowFailure = this.shallow.find(f => f.recordId === failureCommon.recordId);
    if (shallowFailure) {
      this.allFailures[index] = shallowFailure;
      this.enumerateData(this.allFailures);
    }
  }

  onRowEditRemove(failureCommon: FailureCommon) {
    this.failureToDelete = failureCommon;
    this.message = "Действительно удалить?";
    this.dialogVisible = true;
  }

  onConfirm() {
    this.dialogVisible = false;
    this.httpService.deleteFailureCommon(this.failureToDelete).subscribe(() => {
      this.getCommonFailures();
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
    let addCommonFailure: FailureCommon = {
      id: -1, // will be assigned by DB
      recordId: -1,
      failureType: '',
      uavId: '',
      failureDate: '',
      contactPerson: '',
      reportedTs: '',
      description: ''
    };
    this.allFailures.unshift(addCommonFailure);
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
    let filteredFailures: FailureCommon[] = [];
    for (let f of this.allFailures) {
      if (this.containsFilterVal(f, filterValue)) {
        filteredFailures.push(f as FailureCommon);
      }
    }
    this.enumerateData(filteredFailures);
    this.displayedFailures = filteredFailures;
  }

  private containsFilterVal(f: FailureCommon, val: string): boolean {
    return f.failureType.includes(val) ||
        f.uavId.includes(val) ||
        f.failureDate.includes(val) ||
        f.contactPerson.includes(val) ||
        f.reportedTs.includes(val) ||
        f.description.includes(val);
  }

  onCommonFailureRowDoubleClick(rowData: any) {
    console.log(rowData);
    const id = rowData.id;
    if (id !== undefined) {
      //this.router.navigate(['uav-failure-steps'],
      //  { skipLocationChange: true, state: {uavId: this.uav.uavId, failureData: rowData} }).then(() => "Ok");
    }
  }

}
