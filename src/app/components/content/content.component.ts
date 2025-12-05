import {Component, OnInit} from '@angular/core';
import { HttpService } from '../../services/http.service';
import { MessageService } from '../../services/message.service';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {

  isAuthenticated: boolean = false;
  userName: string = '';

  loginError: string = '';

	constructor(private httpService: HttpService,
              private router: Router,
              private route: ActivatedRoute,
              private msgService: MessageService) {
  }

  ngOnInit() {
    if (this.route.snapshot.params.msg === 'Token expired') {
      this.onLogout();
    }
  }

  onLogin(input: any): void {
    this.httpService.login(input).subscribe({
      next: response => {
        if (this.httpService.errorMessage !== '') {
          this.loginError = this.httpService.errorMessage;
          this.loginError += ", вероятно отсутствует связь с сервером...";
        } else if (response.token !== undefined) {
            this.userName = input.login;
            this.httpService.setAuthParams(response);
            this.isAuthenticated = true;
            this.router.navigate(['uav-table'], {skipLocationChange: true}).then(() => "Ok");
        }
      },
      error: err => {
        this.httpService.setAuthParams(null);
        this.msgService.add('Login error: ' + err);
      }
      // ,
      // complete: () => {
      //   this.msgService.add('Login complete')
      // }
    });
  }

  onLogout(): void {
    this.httpService.setAuthParams(null);
    this.isAuthenticated = false;
    this.msgService.clear();
  }

}
