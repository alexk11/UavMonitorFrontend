import {Component, Input, OnInit} from '@angular/core';
import {HttpService} from "../../services/http.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {saveAs} from "file-saver";
import {formatDate} from "@angular/common";
import {UavInfo} from "../../model/uav-info";

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.css'
})
export class PdfViewerComponent implements OnInit {

  @Input() uav!: UavInfo;
  @Input() docType!: string;
  pdfUrl: SafeResourceUrl | undefined;

  titleMap: Map<string, string> | undefined;

  byteArray: any;
  isContent: boolean = false;
  selectedFile: File | null = null;

  title: string | undefined = '';
  addDateInfo: string | undefined = '';

  message: string = '';
  confirmVisible: boolean = false;
  infoVisible: boolean = false;

  constructor(private httpService: HttpService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.setTitle();
    this.loadPdfFromBackend();
  }

  private setTitle() {
    this.titleMap = new Map();
    this.titleMap.set("Slg", "Сертификат летной годности");
    this.titleMap.set("EvalAct", "Акт оценки");
    this.titleMap.set("Insurance", "Документ страхования");
    this.title = this.titleMap.get(this.docType);
  }

  private loadPdfFromBackend(): void {
    this.httpService.downloadPdf(this.uav.uavId, this.docType).subscribe((data: ArrayBuffer) => {
      if (data.byteLength > 0) {
        const blob = new Blob([data], {type: 'application/pdf'});
        const url = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.byteArray = blob;
        this.addDateInfo = this.getAddDateInfo(this.docType);
        this.isContent = true;
      }
    });
  }

  private getAddDateInfo(docType: string): string {
    let ts: string = '';
    switch (docType) {
      case 'Slg':
        ts = this.uav.slgAddTs ? formatDate(this.uav.slgAddTs, 'dd.MM.yyyy HH:mm', 'en') : '';
        break;
      case 'EvalAct':
        ts = this.uav.evalActAddTs ? formatDate(this.uav.evalActAddTs, 'dd.MM.yyyy HH:mm', 'en') : '';
        break;
      case 'Insurance':
        ts = this.uav.insuranceAddTs ? formatDate(this.uav.insuranceAddTs, 'dd.MM.yyyy HH:mm', 'en') : '';
        break;
    }
    if (ts !== undefined && ts !== '') {
      return 'Дата добавления документа: ' + ts;
    }
    return ts;
  }

  onDownload() {
    const dt = formatDate(new Date(), 'yyyy-MM-dd', 'en');
    saveAs(this.byteArray, this.docType.toLowerCase() + '_' + this.uav.uavId + '_' + dt + '.pdf');
  }

  onRemove() {
    this.message = 'Действительно удалить?';
    this.confirmVisible = true;
  }

  onConfirm() {
    this.httpService.deletePdf(this.uav.uavId, this.docType).subscribe(() => {
      this.isContent = false;
      this.addDateInfo = '';
      this.unsetAddDate();
      this.message = 'Изменения сохранены.';
      this.infoVisible = true;
    });
  }

  private updateAddDate() {
    switch (this.docType) {
      case 'Slg':
        this.uav.slgAddTs = new Date();
        break;
      case 'EvalAct':
        this.uav.evalActAddTs = new Date();
        break;
      case 'Insurance':
        this.uav.insuranceAddTs = new Date();
    }
  }

  private unsetAddDate() {
    switch (this.docType) {
      case 'Slg':
        this.uav.slgAddTs = undefined;
        break;
      case 'EvalAct':
        this.uav.evalActAddTs = undefined;
        break;
      case 'Insurance':
        this.uav.insuranceAddTs = undefined;
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files.item(0);
    this.uploadPdf();
  }

  private uploadPdf(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('pdf', this.selectedFile);
      this.httpService.uploadPdf(this.uav.uavId, this.docType, formData).subscribe({
          next: () => {
            if (this.httpService.errorMessage !== '') {
              this.message = this.httpService.errorMessage;
            } else {
              this.message = 'Изменения сохранены';
              this.updateAddDate();
              this.loadPdfFromBackend();
            }
          },
          error: (error: string) => this.message = error, // never getting here (?)
          complete: () => this.infoVisible = true
        });
    } else {
        this.message = 'Файл не выбран';
        this.infoVisible = true;
    }
  }

}
