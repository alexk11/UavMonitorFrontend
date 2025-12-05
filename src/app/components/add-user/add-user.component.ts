import {Component, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {User} from "../../model/user";
import {MessageService} from "../../services/message.service";
import {HttpService} from "../../services/http.service";
import {Router} from "@angular/router";

interface Role {
  name: string,
  code: number
}

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  registerForm!: FormGroup;
  submitted = false;

  dialogVisible: boolean = false;
  message: string = "";
  required: string = 'Обязательное поле';

  roles: Role[] = [
    {name: 'USER', code: 1},
    {name: 'ADMIN', code: 2}
  ];

  constructor(private formBuilder: FormBuilder,
              private httpService: HttpService,
              private router: Router,
              private messageService: MessageService) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.registerForm = this.formBuilder.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        login: ['', Validators.required],
        password: ['', Validators.required],
        role: ['', Validators.required]
      },
    );
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }
    const user: User = this.createUser();
    this.httpService.addUser(user)
      .subscribe({
        next: () => {
          this.message = `Пользователь '${user.login}' создан`;
          if (this.httpService.errorMessage !== '') {
            this.message = this.httpService.errorMessage;
          }
        },
        error: error => this.message = error,
        complete: () => this.dialogVisible = true
      });
  }

  onReset() {
    this.submitted = false;
    this.registerForm.reset();
  }

  onConfirm() {
    this.dialogVisible = false;
    this.router.navigate(['users'], {skipLocationChange: true}).then(() => "Ok");
  }

  onBack() {
    this.router.navigate(['users'], {skipLocationChange: true}).then(() => "Ok");
  }

  private createUser() {
    const fc = this.f;
    return {
      id: -1, // will be assigned by DB
      login: fc.login.value,
      surname: fc.firstName.value,
      lastname: fc.lastName.value,
      password: fc.password.value,
      role: fc.role.value.name,
      enabled: true,
      token: '[protected]'
    };
  }

}

