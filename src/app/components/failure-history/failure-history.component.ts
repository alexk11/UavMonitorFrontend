import {Component, OnInit} from '@angular/core';
import {SelectItem} from "primeng/api";
import {HttpService} from "../../services/http.service";
import {formatDate} from "@angular/common";
import {Router} from "@angular/router";
import {UavFailureStep} from "../../model/uav-failure-step";
import {UavFailure} from "../../model/uav-failure";


@Component({
  selector: 'app-failure-history',
  templateUrl: './failure-history.component.html',
  styleUrl: './failure-history.component.css'
})
export class FailureHistoryComponent implements OnInit {

  uavId!: string;
  failureData!: UavFailure;

  allSteps: UavFailureStep[] = [];
  shallow: UavFailureStep[] = [];
  //displayedSteps: UavFailureStep[] = [];

  level!: SelectItem[];

  message!: string;
  dialogVisible = false;
  stepToDelete!: UavFailureStep;

  constructor(private httpService: HttpService,
              private router: Router
              //,
              //private route: ActivatedRoute
              //,
              /*private location: Location*/) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.uavId = nav?.extras.state['uavId'];
      this.failureData = nav?.extras.state['failureData'];
    }
  }

  ngOnInit() {
    if (this.uavId != undefined && this.failureData != undefined) {
      this.getFailureHistory();
    }
    this.level = [
      { label: 'Ошибка', value: 'ОШИБКА' },
      { label: 'Предупреждение', value: 'ПРЕДУПРЕЖДЕНИЕ' },
      { label: 'Замечание', value: 'ЗАМЕЧАНИЕ' },
      { label: 'Информация', value: 'ИНФОРМАЦИЯ' }
    ];
  }

  private getFailureHistory(): void {
    this.httpService.getUavFailureHistory(this.uavId, this.failureData.recordId)
      .subscribe((data: UavFailureStep[]) => {
        if (data !== null && data !== undefined) {
          data.forEach(s => {
            s.date = this.unixTimestampToDate(s.date);
            s.recordId = s.id;
          });
          this.allSteps = data;
          data.forEach(val => this.shallow.push(Object.assign({}, val)));
          //this.displayedSteps = data;
          this.enumerateData(data);
        }
    });
  }

  private enumerateData(arr: UavFailureStep[]): void {
    let counter = 0;
    arr.sort((a, b) =>
      this.convertStringToDate(a.date) < this.convertStringToDate(b.date) ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  private unixTimestampToDate(unixTs: any): string {
    return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  }

  onRowEditInit(uavFailureStep: UavFailureStep) {
  //  //this.clonedFailures[uavFailure.id as number] = { ...uavFailure };
  }

  onRowEditCancel(uavFailureStep: UavFailureStep, index: number) {
    const shallowStep = this.shallow.find(to => to.recordId === uavFailureStep.recordId);
    if (shallowStep) {
      this.allSteps[index] = shallowStep;
      this.enumerateData(this.allSteps);
    }
  }

  onRowEditSave(uavFailureStep: UavFailureStep) {
    uavFailureStep.uavId = this.uavId;
    uavFailureStep.failureId = this.failureData.recordId;
    uavFailureStep.date = this.convertDateString(uavFailureStep.date);
    this.httpService.saveUavFailureStep(uavFailureStep).subscribe((data: UavFailureStep) => {
      if (data !== null) {
        this.getFailureHistory();
      }
    });
  }

  onRowEditRemove(uavFailureStep: UavFailureStep) {
    this.stepToDelete = uavFailureStep;
    this.message = "Действительно удалить?";
    this.dialogVisible = true;
  }

  onConfirm() {
    this.dialogVisible = false;
    this.httpService.deleteUavFailureStep(this.stepToDelete.failureId, this.stepToDelete.recordId).subscribe(() => {
      this.getFailureHistory();
      //this.message = "Изменения сохранены";
      //this.dialogVisible = true;
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

  // onRowRemove(uavFailureStep: UavFailureStep, index: number) {
  //   uavFailureStep.uavId = this.uavId;
  //   uavFailureStep.date = this.convertDateString(uavFailureStep.date);
  //   this.httpService.deleteUavFailureStep(uavFailureStep).subscribe(() => {
  //     this.getFailureHistory();
  //   });
  // }

  getImportance(status: string) {
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
    let addedStep: UavFailureStep = {
      id: -1, // will be assigned by DB
      recordId: -1,
      uavId: this.uavId,
      failureId: -1,
      date: '',
      contactPerson: '',
      importance: 'ИНФОРМАЦИЯ',
      description: ''
    };
    this.allSteps.unshift(addedStep);
    this.enumerateData(this.allSteps);
  }

  onBack() {
    //this.location.back();
    this.router.navigate(['uav-card', this.uavId, '6'], { skipLocationChange: true }).then(() => "Ok");
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

  // applyFilter(event: Event): void {
  //   this.enumerateData(this.allSteps);
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   if (filterValue.length == 0) {
  //     this.displayedSteps = this.allSteps;
  //     return;
  //   }
  //   let filteredSteps: UavFailureStep[] = [];
  //   for (let s of this.allSteps) {
  //     if (this.containsFilterVal(s, filterValue)) {
  //       filteredSteps.push(s as UavFailureStep);
  //     }
  //   }
  //   this.enumerateData(filteredSteps);
  //   this.displayedSteps = filteredSteps;
  // }

  // private containsFilterVal(s: UavFailureStep, val: string): boolean {
  //   return s.date.includes(val) || s.importance.includes(val) || s.description.includes(val);
  // }

}
