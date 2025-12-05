import {EventEmitter, Component, Output} from '@angular/core';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
  })
export class LoginFormComponent {

  @Output() loginEvent = new EventEmitter();

	active: string = "login";
  login: string = "";
  password: string = "";

  onSubmitLogin(): void {
    this.loginEvent.emit({"login": this.login, "password": this.password});
  }

}
