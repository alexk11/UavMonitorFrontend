import {Component, OnInit} from '@angular/core';
import {HttpService} from "../../services/http.service";
import {formatDate} from "@angular/common";
import {Activity} from "../../model/activity";

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css'
})
export class ActivityComponent implements OnInit {

  allActivities: Activity[] = [];
  displayedActivities: Activity[] = [];


  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.getActivities();
  }

  private getActivities(): void {
    this.httpService.getActivities().subscribe((data: Activity[]) => {
      data.forEach(a => {
        a.date = this.unixTimestampToDate(a.date);
      });
      this.allActivities = data;
      this.displayedActivities = data;
      this.enumerateData(data);
    });
  }

  private enumerateData(arr: Activity[]): void {
    let counter = 0;
    arr.sort((a, b) =>
      this.convertStringToDate(a.date) < this.convertStringToDate(b.date) ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  private unixTimestampToDate(unixTs: any): string {
    return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  }

  ///////////////

  private convertDateString(dateStr: string): string {
    let arr = dateStr.split('.');
    return arr[2] + '-' + arr[1] + '-' + arr[0];
  }

  private convertStringToDate(dateStr: string): Date {
    let d = dateStr.split(".");
    return new Date(d[2] + '/' + d[1] + '/' + d[0]);
  }

  applyFilter(event: Event): void {
    this.enumerateData(this.allActivities);
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length == 0) {
      this.displayedActivities = this.allActivities;
      return;
    }
    let filteredActivities: Activity[] = [];
    for (let a of this.allActivities) {
      if (this.containsFilterVal(a, filterValue)) {
        filteredActivities.push(a as Activity);
      }
    }
    this.enumerateData(filteredActivities);
    this.displayedActivities = filteredActivities;
  }

  private containsFilterVal(a: Activity, val: string): boolean {
    return a.date.includes(val) || a.username.includes(val) || a.ipAddress.includes(val) || a.content.includes(val);
  }

}
