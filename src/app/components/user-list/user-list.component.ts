import {Component, OnInit} from '@angular/core';
import {User} from "../../model/user";
import {HttpService} from "../../services/http.service";
import {Router} from "@angular/router";


@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {

  allUsers: User[] = [];
  displayedUsers: User[] = [];
  selectedUsers: User[] = [];

  message: string = '';
  dialogVisible: boolean = false;

  cols = [
    { field: 'id', header: '№' },
    { field: 'login', header: 'Логин' },
    { field: 'surname', header: 'Имя' },
    { field: 'lastname', header: 'Фамилия' },
    { field: 'role', header: 'Роль' }
  ];

  first = 0;
  rows = 10;

  constructor(private httpService: HttpService,
              private router : Router) {
  }

  ngOnInit(): void {
    this.getUsers();
  }

  private getUsers(): void {
    this.httpService.getUsers().subscribe(data => {
        this.enumerateUsers(data);
        this.allUsers = data;
        this.displayedUsers = data;
    });
  }

  private deleteUsers(): void {
    this.httpService.deleteUsers(this.selectedUsers).subscribe(() => {
      this.getUsers();
      this.message = this.httpService.errorMessage == '' ?
        (this.selectedUsers.length == 1 ? 'Пользователь удален.' : 'Пользователи удалены.') : this.httpService.errorMessage;
      this.dialogVisible = true;
      this.selectedUsers = [];
    });
  }

  onDelete() {
    this.message = 'Действительно удалить?';
    this.dialogVisible = true;
  }

  onConfirm() {
    if (this.selectedUsers.length > 0) {
      this.deleteUsers();
    } else {
      this.dialogVisible = false;
    }
  }

  private enumerateUsers(users: User[]): void {
    let counter = 0;
    users
      .sort((a, b) => a.login > b.login ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  addUser(): void {
    this.router.navigate(['user-add'], { skipLocationChange: true }).then(() => "Ok");
  }

  pageChange(event: { first: number; rows: number; }) {
    this.first = event.first;
    this.rows = event.rows;
  }

  applyFilter(event: Event): void {
    this.enumerateUsers(this.allUsers);
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length == 0) {
      this.displayedUsers = this.allUsers;
      return;
    }
    let filteredUsers: User[] = [];
    for (let u of this.allUsers) {
      if (this.containsFilterVal(u, filterValue)) {
        filteredUsers.push(u as User);
      }
    }
    this.enumerateUsers(filteredUsers);
    this.displayedUsers = filteredUsers;
  }

  private containsFilterVal(u: User, val: string): boolean {
    return u.surname.includes(val) || u.lastname.includes(val) || u.login.includes(val) || u.role.includes(val);
  }

  onUserRowDoubleClick(rowData: any): void {
    const login = rowData.login;
    if (login !== undefined) {
      this.router.navigate(['user-card', login], { skipLocationChange: true}).then(() => "Ok");
    }
  }

}
