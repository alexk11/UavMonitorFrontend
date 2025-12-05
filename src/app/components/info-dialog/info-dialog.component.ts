import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.css'
})
export class InfoDialogComponent {

  @Input() message: string = '';
  @Input() display!: boolean;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.display = false;
  }

  onCancel() {
    this.cancel.emit();
    this.display = false;
  }

}
