import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../services/http.service";
import {MessageService} from "../../services/message.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {User} from "../../model/user";

interface Role {
  name: string,
  code: number
}

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.css'
})
export class UserCardComponent implements OnInit {
  updateForm!: FormGroup;
  submitted = false;

  title: string = '';
  dialogVisible: boolean = false;
  message: string = "";

  user!: User;
  shallow!: User;

  required: string = 'Обязательное поле';
  selectedRole: Role = {
    name: '',
    code: 0
  };
  isActivated: boolean = false;

  roles: Role[] = [
    {name: 'USER', code: 1},
    {name: 'ADMIN', code: 2},
    {name: 'VIEW', code: 3}
  ];

  constructor(private formBuilder: FormBuilder,
              private httpService: HttpService,
              private router: Router,
              private route: ActivatedRoute,
              private messageService: MessageService) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      if(params['login'] !== undefined) {
        this.getUser(params['login']);
      }
    });
    this.initForm();
  }

  get f() {
    return this.updateForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.updateForm.invalid || this.selectedRole.name == '') {
      return;
    }

    if (!this.isUpdated()) {
      this.message = "Нет изменений в данных пользователя";
      this.dialogVisible = true;
    }

    const user: User = this.getUserDetails();
    this.httpService.updateUser(user)
      .subscribe({
        next: () => {
          this.message = 'Изменения сохранены';
          if (this.httpService.errorMessage !== '') {
            this.message = this.httpService.errorMessage;
          }
        },
        error: error => this.message = error, // never getting there (?)
        complete: () => this.dialogVisible = true
      });
  }

  onBack() {
    this.router.navigate(['users'], { skipLocationChange: true }).then(() => "Ok");
  }

  onReset() {
    this.submitted = false;
    this.updateForm.get("firstName")?.reset();
    this.updateForm.get("lastName")?.reset();
    this.updateForm.get("password")?.reset();
    this.selectedRole = this.roles[0];
    this.updateForm.get("enabled")?.reset();
  }

  onConfirm() {
    this.router.navigate(['users'], { skipLocationChange: true }).then(() => 'Ok');
  }

  isUpdated(): boolean {
    return this.shallow.surname !== this.updateForm.controls.firstName.value
      || this.shallow.lastname !== this.updateForm.controls.lastName.value
      || "[protected]" !== this.updateForm.controls.password.value
      || this.shallow.role !== this.updateForm.controls.role.value.name
      || this.shallow.enabled !== this.isActivated;
  }

  private getUser(loginName: string): void {
    this.httpService.getUser(loginName).subscribe(data => {
        this.user = data;
        const userRole = this.roles.find(role => role.name == this.user.role.toUpperCase());
        if (userRole != null) {
          this.selectedRole = userRole;
        }
        this.isActivated = this.user.enabled;
        this.shallow = { ...this.user };
        this.title = `Профиль пользователя ${this.user.login} (${this.user.lastname}, ${this.user.surname})`;
    });
  }

  private initForm() {
    this.updateForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      login: ['', Validators.required],
      password: ['', Validators.required],
      role: ['USER', Validators.required]
    });
    this.updateForm.get("login")?.disable();
  }

  private getUserDetails() {
    const fc = this.f;
    return {
      id: -1, // will be assigned by DB
      login: fc.login.value,
      surname: fc.firstName.value,
      lastname: fc.lastName.value,
      password: fc.password.value,
      role: fc.role.value.name,
      enabled: this.user.enabled,
      token: '[protected]'
    };
  }

}
