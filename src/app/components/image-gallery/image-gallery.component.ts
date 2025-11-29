import {Component, Input, OnInit} from '@angular/core';
import {UavInfo} from "../../model/uav-info";
import {HttpService} from "../../services/http.service";

interface Image {
  imageSrc: string;
  thumbnailSrc: string;
  alt: string;
  dbInx: number;
}

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.css'
})
export class ImageGalleryComponent implements OnInit {

  @Input() uav!: UavInfo;

  images: Image[] = [];
  //imgSrc: string | null = null;

  selectedFile: File | null = null;
  currentImageIndex: number = 0;

  message: string = '';
  feedbackVisible: boolean = false;

  constructor(private httpService: HttpService) {
  }

  ngOnInit() {
    this.getImages();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files.item(0);
    this.uploadImage();
  }

  private uploadImage(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      this.httpService.uploadImage(this.uav.uavId, formData).subscribe({
        next: () => {
          if (this.httpService.errorMessage !== '') {
            this.message = this.httpService.errorMessage;
          } else {
            this.message = 'Изменения сохранены';
          }
        },
        error: (error: string) => this.message = error, // never getting here (?)
        complete: () => {
          this.getImages();
          this.feedbackVisible = true;
        }
      });
    } else {
      this.message = 'Файл не выбран';
      this.feedbackVisible = true;
    }
  }

  onRemove() {
    this.httpService.deleteImage(this.images[this.currentImageIndex].dbInx)
      .subscribe(() => this.getImages());
  }

  // private getOneImage(inx: number) {
  //   this.httpService.downloadOneImage(inx).subscribe(blob => {
  //     this.blobToBase64(blob)
  //       .then((base64) => {
  //         this.imgSrc = "data:image/png;base64," + base64;
  //       });
  //   });
  // }

  private getImages() {
    this.images = [];
    this.httpService.fetchImageDBIds(this.uav.uavId)
      .subscribe((data: number[]) => {
        for (let inx of data) {
          this.httpService.downloadOneImage(inx).subscribe(blob => {
            this.blobToBase64(blob).then((base64) => {
              //console.log('Base64 string:', base64);
              const image: Image = {
                imageSrc: "data:image/png;base64," + base64,
                thumbnailSrc: "data:image/png;base64," + base64,
                alt: "Alt text",
                dbInx: inx
              };
              this.images.push(image);
            });
          });
        }
      });
  }

  // private getImages() {
  //   this.httpService.downloadImages(this.uav.uavId).subscribe((blobs: Blob[]) => {
  //     for (let i = 0; i < blobs.length; i++) {
  //       const image: Image = {
  //         imageSrc: "",
  //         thumbnailSrc: "Thumbnail text",
  //         alt: "Alt text",
  //         //dbInx: inx => load whole object, not just blob
  //       };
  //       this.blobToBase64(blobs[i])
  //         .then((base64) => {
  //           //console.log('Base64 string:', base64);
  //           image.imageSrc = "data:image/png;base64," + base64;
  //         });
  //       this.images.push(image);
  //     }
  //   });
  // }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // The result will be a data URL (e.g., "data:image/png;base64,...")
          // We often need just the base64 part, so we remove the prefix.
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('FileReader result is not a string.'));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }

}
