import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';

import {User} from '../model/user';
import {MessageService} from './message.service';
import {Vehicle} from "../model/vehicle";
import {UavInfo} from "../model/uav-info";
import {AppConfigService} from "./config.service";
import {UavTO} from "../model/uav-to";
import {UavFailure} from "../model/uav-failure";
import {Activity} from "../model/activity";
import {UavFailureStep} from "../model/uav-failure-step";
import {Router} from "@angular/router";
import {UavInsuranceData} from "../model/uav-insurance-data";
import {formatDate} from "@angular/common";
import {UavEngine} from "../model/uav-engine";


@Injectable({ providedIn: 'root' })
export class HttpService {

  constructor(private http: HttpClient,
              private router: Router,
              private messageService: MessageService,
              private appConfig: AppConfigService) {
  }
  // URL to web api
  private readonly backUrl: string = this.appConfig.getConfig().backUrl;
  // Tomcat
  //private readonly backUrl: string = 'http://localhost:8091/uav-monitor-backend';
  errorMessage: string = "";

  public getUserName(): string {
    return this.appConfig.getConfig().userName;
  }

  private getAuthToken(): string | null {
    return this.appConfig.getConfig().authToken;
  }

  setAuthParams(data: any): void {
    if (data !== null) {
      this.appConfig.getConfig().authToken = data.token !== null ? data.token : '';
      this.appConfig.getConfig().userName = data.login !== null ? data.login : '';
      this.appConfig.getConfig().userRole = data.role !== null ? data.role : '';
    } else {
      this.appConfig.getConfig().authToken = '';
      this.appConfig.getConfig().userName = '';
      this.appConfig.getConfig().userRole = '';
    }
  }

  private getAuthHeader(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': 'Bearer ' + this.getAuthToken() });
  }

  /** Login to the application and get an auth token */
  login(input: any): Observable<any> {
    this.errorMessage = '';
    return this.http.post<any>(`${this.backUrl}/login`, input)
      .pipe(
        tap(_ => this.messageService.add(`User \"${input.login}\" logged in`)),
        catchError(this.handleError<string[]>('login', []))
    );
  }

// Vehicle table methods
  /** GET vehicles from the server */
  getVehicles(): Observable<Vehicle[]> {
    this.errorMessage = '';
    return this.http.get<Vehicle[]>(`${this.backUrl}/getVehicles`, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.log('Fetched vehicles')),
        catchError(this.handleError<Vehicle[]>('getVehicles', []))
      );
  }

  /** POST: create new uav on the server */
  addVehicle(vehicle: Vehicle): Observable<any> {
    this.errorMessage = '';
    return this.http.post<number>(`${this.backUrl}/addUav`, vehicle, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Created vehicle id=${vehicle.vehicleId}`)),
        catchError(this.handleError<number>('addVehicle'))
      );
  }

  /** POST: delete vehicles on the server */
  deleteVehicles(vehicles: Vehicle[]): Observable<any> {
    this.errorMessage = '';
    return this.http.request('DELETE', `${this.backUrl}/deleteUavs`, { headers: this.getAuthHeader(), body: vehicles })
      .pipe(
        tap(_ => this.messageService.add("Vehicle(s) deleted.")),
        catchError(this.handleError<any>('deleteVehicles', []))
      );
  }

  /** PUT: update vehicle on the server */
  updateVehicle(vehicle: Vehicle): Observable<any> {
    this.errorMessage = '';
    return this.http.put(`${this.backUrl}/updateUav`, vehicle, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.log(`Updated vehicle id=${vehicle.vehicleId}`)),
        catchError(this.handleError<any>('updateVehicle'))
      );
  }

// Users table methods
  /** GET users from the server */
  getUsers(): Observable<User[]> {
    this.errorMessage = '';
    return this.http.get<User[]>(`${this.backUrl}/getUsers`, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.log('Fetched users')),
        catchError(this.handleError<User[]>('getUsers', []))
      );
  }

  /** GET user by login name. Returns 404 if the login not found */
  getUser(loginName: String): Observable<User> {
    this.errorMessage = '';
    const url = `${this.backUrl}/getUser/${loginName}`;
    return this.http.get<User>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Fetched user name='${loginName}'`)),
        catchError(this.handleError<User>(`getUser login=${loginName}`))
    );
  }

  /** POST: create user on the server */
  addUser(user: User): Observable<any> {
    this.errorMessage = '';
    return this.http.post(`${this.backUrl}/register`, user, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Created user id=${user.id}`)),
        catchError(this.handleError<any>('register'))
    );
  }

  /** DELETE: delete users on the server */
  deleteUsers(users: User[]): Observable<any> {
    this.errorMessage = '';
    return this.http.request('DELETE', `${this.backUrl}/deleteUsers`, { headers: this.getAuthHeader(), body: users })
      .pipe(
        tap(_ => this.messageService.add("Users deleted.")),
        catchError(this.handleError<any>('deleteUsers', []))
    );
  }

  /** PUT: update the user on the server */
  updateUser(user: User): Observable<any> {
    this.errorMessage = '';
    return this.http.put(`${this.backUrl}/updateUser`, user, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.log(`Updated user id=${user.id}`)),
        catchError(this.handleError<any>('updateUser'))
    );
  }

// UAV Info tab
  /** GET vehicle info by vehicle id. Returns 404 if the info is not found */
  getUavInfo(id: String): Observable<UavInfo> {
    this.errorMessage = '';
    const url = `${this.backUrl}/getUavInfo/${id}`;
    return this.http.get<UavInfo>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Fetched uav data for='${id}'`)),
        catchError(this.handleError<UavInfo>(`getUavInfo id=${id}`))
      );
  }

  /** POST vehicle info */
  postUavInfo(data: UavInfo): Observable<UavInfo> {
    this.errorMessage = '';
    const url = `${this.backUrl}/postUavInfo`;
    return this.http.post<UavInfo>(url, data, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Posted uav data for='${data.uavId}'`)),
        catchError(this.handleError<UavInfo>(`postUavInfo id=${data.uavId}`))
      );
  }

  putInsuranceExpiryDate(uavId: string, expiryDate: Date): Observable<any> {
    this.errorMessage = '';
    const url = `${this.backUrl}/updateInsuranceExpiryDate`;
    const body: UavInsuranceData = {
      uavId: uavId,
      expiryDate: formatDate(expiryDate, 'yyyy-MM-dd', 'en'),
    };
    return this.http.put(url, body, { headers: this.getAuthHeader() })
        .pipe(
            tap(_ => this.log(`Updated insurance expiry date for id=${uavId}`)),
            catchError(this.handleError<any>('putInsuranceExpiryDate'))
        );
  }

// PDF tabs methods (СЛГ, Акт оценки, Страхование)
  downloadPdf(uavId: string, docType: string): Observable<any> {
    this.errorMessage = '';
    const url = `${this.backUrl}/downloadPdf/${uavId}/${docType}`;
    return this.http.get(url, { responseType: 'arraybuffer', headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Downloaded pdf type '${docType}' for='${uavId}'`)),
        catchError(this.handleError<any>(`downloadPdf id=${uavId}`))
      );
  }

  uploadPdf(uavId: string, docType: string, pdf: any): Observable<any> {
    this.errorMessage = '';
    const url = `${this.backUrl}/uploadPdf/${uavId}/${docType}`;
    return this.http.post<number>(url, pdf, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Posted new pdf type '${docType}' for='${uavId}'`)),
        catchError(this.handleError<number>(`uploadPdf id=${uavId}`))
      );
  }

  deletePdf(uavId: string, docType: string): Observable<any> {
    this.errorMessage = '';
    const url = `${this.backUrl}/deletePdf/${uavId}/${docType}`;
    return this.http.request('DELETE', url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Deleted pdf doc '${docType}' for='${uavId}'`)),
        catchError(this.handleError<any>(`deletePdf uavId='${uavId}', docType='${docType}'`))
      );
  }

// Photo tab
  uploadImage(uavId: string, image: any): Observable<any> {
    this.errorMessage = '';
    const url = `${this.backUrl}/uploadImage/${uavId}`;
    return this.http.post<number>(url, image, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Posted new image for='${uavId}'`)),
        catchError(this.handleError<number>(`uploadImage id=${uavId}`))
      );
  }

  deleteImage(imgId: number): Observable<any> {
    this.errorMessage = '';
    const url = `${this.backUrl}/deleteImage/${imgId}`;
    return this.http.delete<number>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Deleted image with id='${imgId}'`)),
        catchError(this.handleError<number>(`deleteImage id=${imgId}`))
      );
  }

  fetchImageDBIds(uavId: string): Observable<number[]> {
    this.errorMessage = '';
    const url = `${this.backUrl}/fetchImageIds/${uavId}`;
    return this.http.get<number[]>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Got images location in DB for='${uavId}'`)),
        catchError(this.handleError<number[]>(`fetchImageIds id=${uavId}`))
      );
  }

 // TO tab
  getUavTOs(uavId: string): Observable<UavTO[]> {
    this.errorMessage = '';
    const url = `${this.backUrl}/getUavTOs/${uavId}`;
    return this.http.get<UavTO[]>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Got TO data from DB for='${uavId}'`)),
        catchError(this.handleError<UavTO[]>(`getUavTOs id=${uavId}`))
      );
  }

  saveUavTO(data: UavTO): Observable<UavTO> {
    this.errorMessage = '';
    const url = `${this.backUrl}/saveUavTO`;
    return this.http.post<UavTO>(url, data, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Posted UavTO`)),
        catchError(this.handleError<UavTO>(`saveUavTO`))
      );
  }

  /** DELETE: delete UavTO on the server */
  deleteUavTO(uavTO: UavTO): Observable<any> {
    this.errorMessage = '';
    return this.http.request('DELETE', `${this.backUrl}/deleteUavTO`, { headers: this.getAuthHeader(), body: uavTO })
      .pipe(
        tap(_ => this.messageService.add("UavTO deleted.")),
        catchError(this.handleError<UavTO>('deleteUavTO'))
      );
  }

  //// Engine resource
  getUavTOInfo(uavId: string): Observable<UavEngine[]> {
    this.errorMessage = '';
    const url = `${this.backUrl}/getUavTOInfo/${uavId}`;
    return this.http.get<UavEngine[]>(url, { headers: this.getAuthHeader() })
        .pipe(
            tap(_ => this.messageService.add(`Got TO data from DB for='${uavId}'`)),
            catchError(this.handleError<UavEngine[]>(`getUavTOs id=${uavId}`))
        );
  }

  saveUavTOInfo(data: UavEngine): Observable<UavEngine> {
    this.errorMessage = '';
    const url = `${this.backUrl}/saveUavTOInfo`;
    return this.http.post<UavEngine>(url, data, { headers: this.getAuthHeader() })
        .pipe(
            tap(_ => this.messageService.add(`Posted UavEngine info`)),
            catchError(this.handleError<UavEngine>(`saveUavEngine info`))
        );
  }

  /** DELETE: delete UavEngine info on the server */
  deleteUavTOInfo(data: UavEngine): Observable<any> {
    this.errorMessage = '';
    return this.http.request('DELETE', `${this.backUrl}/deleteUavTOInfo`, { headers: this.getAuthHeader(), body: data })
        .pipe(
            tap(_ => this.messageService.add("UavTOInfo deleted.")),
            catchError(this.handleError<UavEngine>('deleteUavTOInfo'))
        );
  }

  // downloadImages(uavId: string): Observable<Blob[]> {
  //   this.errorMessage = '';
  //   const url = `${this.backUrl}/downloadImages/${uavId}`;
  //   // @ts-ignore
  //   return this.http.get(url, { responseType: 'blob', headers: this.getAuthHeader() })
  //     .pipe(
  //       map((responseBlob: Blob) => {
  //         // Assuming the responseBlob contains a JSON string that, when parsed,
  //         // provides information to construct multiple Blobs.
  //         // This is a common scenario if you're not getting raw multiple Blobs.
  //         return new Observable<Blob[]>(observer => {
  //           const reader = new FileReader();
  //           reader.onload = () => {
  //             try {
  //               const data = JSON.parse(reader.result as string);
  //               // Assuming 'data' is an array of objects, and each object
  //               // contains information to create a new Blob.
  //               const blobArray: Blob[] = data.map((item: any) => {
  //                 // Example: create a new Blob from a base64 string or other data
  //                 return new Blob([item.content], { type: item.contentType });
  //               });
  //               observer.next(blobArray);
  //               observer.complete();
  //             } catch (e) {
  //               observer.error(e);
  //             }
  //           };
  //           reader.onerror = (error) => observer.error(error);
  //           reader.readAsText(responseBlob);
  //         });
  //       })
  //     );
  // }

  downloadOneImage(imgId: number): Observable<Blob> {
    this.errorMessage = '';
    const url = `${this.backUrl}/downloadOneImage/${imgId}`;
    return this.http.get(url, { responseType: 'blob', headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Downloaded image for='${imgId}'`)),
        catchError(this.handleError<Blob>(`downloadOneImage id=${imgId}`))
      );
  }

// Failure methods
  getUavFailures(uavId: string): Observable<UavFailure[]> {
    this.errorMessage = '';
    const url = `${this.backUrl}/fetchUavFailures/${uavId}`;
    return this.http.get<UavFailure[]>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Got failures data from DB for='${uavId}'`)),
        catchError(this.handleError<UavFailure[]>(`getUavFailures id=${uavId}`))
      );
  }

  saveUavFailure(data: UavFailure): Observable<UavFailure> {
    this.errorMessage = '';
    const url = `${this.backUrl}/saveUavFailure`;
    return this.http.post<UavFailure>(url, data, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Posted UavFailure`)),
        catchError(this.handleError<UavFailure>(`saveUavFailure`))
      );
  }

  /** DELETE: delete UavFailure on the server */
  deleteUavFailure(uavFailure: UavFailure): Observable<any> {
    this.errorMessage = '';
    return this.http.request('DELETE',
          `${this.backUrl}/deleteUavFailure/${uavFailure.uavId}/${uavFailure.recordId}`,
          { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add("UavFailure deleted.")),
        catchError(this.handleError<UavFailure>('deleteUavFailure'))
      );
  }

// Logs button table
  getActivities(): Observable<Activity[]> {
    this.errorMessage = '';
    const url = `${this.backUrl}/getEvents`;
    return this.http.get<Activity[]>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Got activity data from DB`)),
        catchError(this.handleError<Activity[]>('getEvents'))
      );
  }

// Failure history tab
  getUavFailureHistory(uavId: string, failureId: number): Observable<UavFailureStep[]> {
    this.errorMessage = '';
    const url = `${this.backUrl}/fetchFailureSteps/${uavId}/${failureId}`;
    return this.http.get<UavFailureStep[]>(url, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Got failure history from DB for='${uavId}'`)),
        catchError(this.handleError<UavFailureStep[]>(`fetchUavFailureSteps uavId=${uavId}, failureId=${failureId}`))
      );
  }

  saveUavFailureStep(data: UavFailureStep): Observable<UavFailureStep> {
    this.errorMessage = '';
    const url = `${this.backUrl}/saveFailureStep`;
    return this.http.post<UavFailureStep>(url, data, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add(`Posted UavFailureStep`)),
        catchError(this.handleError<UavFailureStep>(`saveUavFailureStep`))
      );
  }

  /** DELETE: delete UavFailureStep on the server */
  deleteUavFailureStep(failureId: number, failureStepId: number): Observable<any> {
    this.errorMessage = '';
    return this.http.request('DELETE', `${this.backUrl}/deleteFailureStep/${failureId}/${failureStepId}`, { headers: this.getAuthHeader() })
      .pipe(
        tap(_ => this.messageService.add("UavFailureStep deleted.")),
        catchError(this.handleError<UavFailureStep>('deleteUavFailureStep'))
      );
  }


  /**
   * Handle Http operation that failed.
   * Let the app continue.
   *
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (err: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      console.error(err);
      this.messageService.add(`${operation} failed: ${err.error.message}`);
      // Error message to be displayed in the calling component
      //this.errorMessage = `Ошибка: ${err.error.message}`;
      this.errorMessage = `Ошибка: ${err.message}`;
      // Auth token expired, navigate to login page
      if (err.status == 401 && err.error.message === 'Unauthorized path') {
        this.router.navigate(['content'],
            { skipLocationChange: true, state: {msg: 'Token expired'} }).then(() => "Ok");
      }
      // Unset authorization token
      // this.setAuthToken(null);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log an HttpService message with the MessageService */
  public log(message: string) {
    this.messageService.add(`HttpService: ${message}`);
  }

}
