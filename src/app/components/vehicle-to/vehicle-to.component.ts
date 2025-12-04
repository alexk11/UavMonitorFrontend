import {Component, Input, OnInit} from '@angular/core';
import {MessageService, SelectItem} from "primeng/api";
import {UavInfo} from "../../model/uav-info";
import {HttpService} from "../../services/http.service";
import {UavTO} from "../../model/uav-to";
import {formatDate} from "@angular/common";


@Component({
  selector: 'app-vehicle-to',
  templateUrl: './vehicle-to.component.html',
  styleUrl: './vehicle-to.component.css',
  providers: [MessageService]
})
export class VehicleToComponent implements OnInit {

  @Input() uav!: UavInfo;

  //products!: Product[];
  //clonedProducts: { [s: string]: Product } = {};

  states!: SelectItem[];

  allTOs: UavTO[] = [];
  //displayedTOs: UavTO[] = [];
  shallow: UavTO[] = []; //{ [s: string]: UavTO } = {};

  date!: Date;
  progressbarInterval: number = 0

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.states = [
      { label: 'Запланировано', value: 'ЗАПЛАНИРОВАНО' },
      { label: 'Выполнено', value: 'ВЫПОЛНЕНО' },
      { label: 'Замечания', value: 'ЗАМЕЧАНИЯ' },
      //{ label: 'Ошибки', value: 'ОШИБКИ' },
      { label: 'Неизвестно', value: 'НЕИЗВЕСТНО' }
    ];

    if (this.uav !== null) {
      this.getTOInfo();
    }
  }

  private getTOInfo(): void {
    this.httpService.getUavTOs(this.uav.uavId).subscribe((data: UavTO[]) => {
      data.forEach(to => {
        to.inspectionDate = this.unixTimestampToDate(to.inspectionDate);
        to.recordId = to.id;
      });
      this.allTOs = data;
      data.forEach(val => this.shallow.push(Object.assign({}, val)));
      this.enumerateTOs();
      this.getProgressBarInterval();
    });
  }

  private getProgressBarInterval(): void {
    let now = new Date();
    let differenceInMs = 0;
    let differenceInDays: number[] = [];
    const millisecondsInDay = 1000 * 60 * 60 * 24;
    this.allTOs.forEach(to => {
      let toDate = this.convertStringToDate(to.inspectionDate);
      if (toDate > now) {
        differenceInMs = Math.abs(toDate.getTime() - now.getTime());
        differenceInDays.push(Math.floor(differenceInMs / millisecondsInDay));
      }
    });
    if (differenceInDays.length > 0) {
      this.progressbarInterval = Math.min(...differenceInDays); // nearest TO
    } else {
      this.progressbarInterval = - 1; // no info on upcoming TO
    }
  }

  private enumerateTOs(): void {
    let counter = 0;
    this.allTOs
      .sort((a, b) =>
        this.convertStringToDate(a.inspectionDate) < this.convertStringToDate(b.inspectionDate) ? 1 : -1)
      .forEach(v => v.id = ++counter);
  }

  private unixTimestampToDate(unixTs: any): string {
    return formatDate(new Date(unixTs), 'dd.MM.yyyy', 'en-US');
  }

  ///////////////

  onRowEditInit(uavTO: UavTO) {
    //this.clonedTOs[uavTO.id as number] = { ...uavTO };
  }

  onRowEditSave(uavTO: UavTO) {
    uavTO.uavId = this.uav.uavId;
    uavTO.inspectionDate = this.convertDateString(uavTO.inspectionDate);
    this.httpService.saveUavTO(uavTO).subscribe((data: UavTO) => {
      if (data !== null) {
        this.getTOInfo();
      }
    });
  }

  private convertDateString(dateStr: string): string {
    let arr = dateStr.split('.');
    return arr[2] + '-' + arr[1] + '-' + arr[0];
  }

  private convertStringToDate(dateStr: string): Date {
    let d = dateStr.split(".");
    return new Date(d[2] + '/' + d[1] + '/' + d[0]);
  }

  onRowEditCancel(uavTO: UavTO, index: number) {
    const shallowTO = this.shallow.find(to => to.recordId === uavTO.recordId);
    if (shallowTO) {
      this.allTOs[index] = shallowTO;
      this.enumerateTOs()
    }
  }

  onRowRemove(uavTO: UavTO, index: number) {
    uavTO.uavId = this.uav.uavId;
    uavTO.inspectionDate = this.convertDateString(uavTO.inspectionDate);
    this.httpService.deleteUavTO(uavTO).subscribe(() => {
      this.getTOInfo();
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'ВЫПОЛНЕНО':
        return 'success';
      case 'ЗАМЕЧАНИЯ':
        return 'warn';
      case 'ОШИБКИ':
        return 'danger';
      case 'ЗАПЛАНИРОВАНО':
      case 'НЕИЗВЕСТНО':
      default:
        return 'info';
    }
  }

  onAdd() {
    let addTO: UavTO = {
      id: -1, // will be assigned by DB
      recordId: -1,
      uavId: this.uav.uavId,
      inspectionDate: '',
      status: 'ЗАПЛАНИРОВАНО',
      note: ''
    };
    this.allTOs.unshift(addTO);
    this.enumerateTOs();
    //this.shallow = {...this.allTOs };
    //this.onRowEditSave(addTO);
  }

  onReset() {
    this.allTOs = {... this.shallow };
  }

  getProgressPercentage(): number {
    // Calculate percentage based on 365 days max
    // Inverted: 0 days = 100%, 365+ days = 0%
    const maxDays = 365;
    if (this.progressbarInterval <= 0) return 100;
    if (this.progressbarInterval >= maxDays) return 0;
    return Math.round(((maxDays - this.progressbarInterval) / maxDays) * 100);
  }

  getBarColor(): string {
    if (this.progressbarInterval < 30) {
      return '#dc3545'; // Red
    } else if (this.progressbarInterval >= 30 && this.progressbarInterval < 90) {
      return '#fd7e14'; // Orange
    } else if (this.progressbarInterval >= 90 && this.progressbarInterval < 180) {
      return '#ffc107'; // Yellow
    }
    return '#28a745'; // Green
  }

  getDaysBeforeTO(): string {
    let msg = `${this.progressbarInterval}`;
    let lastDigit = Math.abs(this.progressbarInterval % 10);
    if(lastDigit == 1 && this.progressbarInterval !== 11) {
      msg += ' день';
    } else if(this.progressbarInterval > 10 && this.progressbarInterval < 20) {
      msg += ' дней';
    } else if(lastDigit > 1 && lastDigit < 5) {
      msg += ' дня';
    } else {
      msg += ' дней';
    }
    return msg + ' до ближайшего ТО';
  }

  getSeverityClass(): string {
    if (this.progressbarInterval < 30) {
      return 'status-critical';
    } else if (this.progressbarInterval >= 30 && this.progressbarInterval < 90) {
      return 'status-warning';
    } else if (this.progressbarInterval >= 90 && this.progressbarInterval < 180) {
      return 'status-attention';
    }
    return 'status-good';
  }


  // onSave(uavTO: UavTO) {
  //   this.httpService.saveUavTO(uavTO).subscribe((data: UavTO) => {
  //     // this.allTOs = data;
  //     // this.message = "Изменения сохранены";
  //     // if (this.httpService.errorMessage !== '') {
  //     //   this.message = this.httpService.errorMessage;
  //     // }
  //     // this.feedbackVisible = true;
  //     // this.backUpData();
  //   });
  // }

  // getProductsData() {
  //   return [
  //     {
  //       id: '1000',
  //       code: 'f230fh0g3',
  //       name: 'Bamboo Watch',
  //       description: 'Product Description',
  //       image: 'bamboo-watch.jpg',
  //       price: 65,
  //       category: 'Accessories',
  //       quantity: 24,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1001',
  //       code: 'nvklal433',
  //       name: 'Black Watch',
  //       description: 'Product Description',
  //       image: 'black-watch.jpg',
  //       price: 72,
  //       category: 'Accessories',
  //       quantity: 61,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1002',
  //       code: 'zz21cz3c1',
  //       name: 'Blue Band',
  //       description: 'Product Description',
  //       image: 'blue-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 2,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1003',
  //       code: '244wgerg2',
  //       name: 'Blue T-Shirt',
  //       description: 'Product Description',
  //       image: 'blue-t-shirt.jpg',
  //       price: 29,
  //       category: 'Clothing',
  //       quantity: 25,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1004',
  //       code: 'h456wer53',
  //       name: 'Bracelet',
  //       description: 'Product Description',
  //       image: 'bracelet.jpg',
  //       price: 15,
  //       category: 'Accessories',
  //       quantity: 73,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1005',
  //       code: 'av2231fwg',
  //       name: 'Brown Purse',
  //       description: 'Product Description',
  //       image: 'brown-purse.jpg',
  //       price: 120,
  //       category: 'Accessories',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1006',
  //       code: 'bib36pfvm',
  //       name: 'Chakra Bracelet',
  //       description: 'Product Description',
  //       image: 'chakra-bracelet.jpg',
  //       price: 32,
  //       category: 'Accessories',
  //       quantity: 5,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1007',
  //       code: 'mbvjkgip5',
  //       name: 'Galaxy Earrings',
  //       description: 'Product Description',
  //       image: 'galaxy-earrings.jpg',
  //       price: 34,
  //       category: 'Accessories',
  //       quantity: 23,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1008',
  //       code: 'vbb124btr',
  //       name: 'Game Controller',
  //       description: 'Product Description',
  //       image: 'game-controller.jpg',
  //       price: 99,
  //       category: 'Electronics',
  //       quantity: 2,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1009',
  //       code: 'cm230f032',
  //       name: 'Gaming Set',
  //       description: 'Product Description',
  //       image: 'gaming-set.jpg',
  //       price: 299,
  //       category: 'Electronics',
  //       quantity: 63,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1010',
  //       code: 'plb34234v',
  //       name: 'Gold Phone Case',
  //       description: 'Product Description',
  //       image: 'gold-phone-case.jpg',
  //       price: 24,
  //       category: 'Accessories',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1011',
  //       code: '4920nnc2d',
  //       name: 'Green Earbuds',
  //       description: 'Product Description',
  //       image: 'green-earbuds.jpg',
  //       price: 89,
  //       category: 'Electronics',
  //       quantity: 23,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1012',
  //       code: '250vm23cc',
  //       name: 'Green T-Shirt',
  //       description: 'Product Description',
  //       image: 'green-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 74,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1013',
  //       code: 'fldsmn31b',
  //       name: 'Grey T-Shirt',
  //       description: 'Product Description',
  //       image: 'grey-t-shirt.jpg',
  //       price: 48,
  //       category: 'Clothing',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1014',
  //       code: 'waas1x2as',
  //       name: 'Headphones',
  //       description: 'Product Description',
  //       image: 'headphones.jpg',
  //       price: 175,
  //       category: 'Electronics',
  //       quantity: 8,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1015',
  //       code: 'vb34btbg5',
  //       name: 'Light Green T-Shirt',
  //       description: 'Product Description',
  //       image: 'light-green-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 34,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1016',
  //       code: 'k8l6j58jl',
  //       name: 'Lime Band',
  //       description: 'Product Description',
  //       image: 'lime-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 12,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1017',
  //       code: 'v435nn85n',
  //       name: 'Mini Speakers',
  //       description: 'Product Description',
  //       image: 'mini-speakers.jpg',
  //       price: 85,
  //       category: 'Clothing',
  //       quantity: 42,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1018',
  //       code: '09zx9c0zc',
  //       name: 'Painted Phone Case',
  //       description: 'Product Description',
  //       image: 'painted-phone-case.jpg',
  //       price: 56,
  //       category: 'Accessories',
  //       quantity: 41,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1019',
  //       code: 'mnb5mb2m5',
  //       name: 'Pink Band',
  //       description: 'Product Description',
  //       image: 'pink-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 63,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1020',
  //       code: 'r23fwf2w3',
  //       name: 'Pink Purse',
  //       description: 'Product Description',
  //       image: 'pink-purse.jpg',
  //       price: 110,
  //       category: 'Accessories',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1021',
  //       code: 'pxpzczo23',
  //       name: 'Purple Band',
  //       description: 'Product Description',
  //       image: 'purple-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 6,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1022',
  //       code: '2c42cb5cb',
  //       name: 'Purple Gemstone Necklace',
  //       description: 'Product Description',
  //       image: 'purple-gemstone-necklace.jpg',
  //       price: 45,
  //       category: 'Accessories',
  //       quantity: 62,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1023',
  //       code: '5k43kkk23',
  //       name: 'Purple T-Shirt',
  //       description: 'Product Description',
  //       image: 'purple-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 2,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1024',
  //       code: 'lm2tny2k4',
  //       name: 'Shoes',
  //       description: 'Product Description',
  //       image: 'shoes.jpg',
  //       price: 64,
  //       category: 'Clothing',
  //       quantity: 0,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1025',
  //       code: 'nbm5mv45n',
  //       name: 'Sneakers',
  //       description: 'Product Description',
  //       image: 'sneakers.jpg',
  //       price: 78,
  //       category: 'Clothing',
  //       quantity: 52,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4
  //     },
  //     {
  //       id: '1026',
  //       code: 'zx23zc42c',
  //       name: 'Teal T-Shirt',
  //       description: 'Product Description',
  //       image: 'teal-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 3,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1027',
  //       code: 'acvx872gc',
  //       name: 'Yellow Earbuds',
  //       description: 'Product Description',
  //       image: 'yellow-earbuds.jpg',
  //       price: 89,
  //       category: 'Electronics',
  //       quantity: 35,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 3
  //     },
  //     {
  //       id: '1028',
  //       code: 'tx125ck42',
  //       name: 'Yoga Mat',
  //       description: 'Product Description',
  //       image: 'yoga-mat.jpg',
  //       price: 20,
  //       category: 'Fitness',
  //       quantity: 15,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5
  //     },
  //     {
  //       id: '1029',
  //       code: 'gwuby345v',
  //       name: 'Yoga Set',
  //       description: 'Product Description',
  //       image: 'yoga-set.jpg',
  //       price: 20,
  //       category: 'Fitness',
  //       quantity: 25,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 8
  //     }
  //   ];
  // }
  //
  // getProductsWithOrdersData() {
  //   return [
  //     {
  //       id: '1000',
  //       code: 'f230fh0g3',
  //       name: 'Bamboo Watch',
  //       description: 'Product Description',
  //       image: 'bamboo-watch.jpg',
  //       price: 65,
  //       category: 'Accessories',
  //       quantity: 24,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5,
  //       orders: [
  //         {
  //           id: '1000-0',
  //           productCode: 'f230fh0g3',
  //           date: '2020-09-13',
  //           amount: 65,
  //           quantity: 1,
  //           customer: 'David James',
  //           status: 'PENDING'
  //         },
  //         {
  //           id: '1000-1',
  //           productCode: 'f230fh0g3',
  //           date: '2020-05-14',
  //           amount: 130,
  //           quantity: 2,
  //           customer: 'Leon Rodrigues',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1000-2',
  //           productCode: 'f230fh0g3',
  //           date: '2019-01-04',
  //           amount: 65,
  //           quantity: 1,
  //           customer: 'Juan Alejandro',
  //           status: 'RETURNED'
  //         },
  //         {
  //           id: '1000-3',
  //           productCode: 'f230fh0g3',
  //           date: '2020-09-13',
  //           amount: 195,
  //           quantity: 3,
  //           customer: 'Claire Morrow',
  //           status: 'CANCELLED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1001',
  //       code: 'nvklal433',
  //       name: 'Black Watch',
  //       description: 'Product Description',
  //       image: 'black-watch.jpg',
  //       price: 72,
  //       category: 'Accessories',
  //       quantity: 61,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1001-0',
  //           productCode: 'nvklal433',
  //           date: '2020-05-14',
  //           amount: 72,
  //           quantity: 1,
  //           customer: 'Maisha Jefferson',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1001-1',
  //           productCode: 'nvklal433',
  //           date: '2020-02-28',
  //           amount: 144,
  //           quantity: 2,
  //           customer: 'Octavia Murillo',
  //           status: 'PENDING'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1002',
  //       code: 'zz21cz3c1',
  //       name: 'Blue Band',
  //       description: 'Product Description',
  //       image: 'blue-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 2,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1002-0',
  //           productCode: 'zz21cz3c1',
  //           date: '2020-07-05',
  //           amount: 79,
  //           quantity: 1,
  //           customer: 'Stacey Leja',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1002-1',
  //           productCode: 'zz21cz3c1',
  //           date: '2020-02-06',
  //           amount: 79,
  //           quantity: 1,
  //           customer: 'Ashley Wickens',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1003',
  //       code: '244wgerg2',
  //       name: 'Blue T-Shirt',
  //       description: 'Product Description',
  //       image: 'blue-t-shirt.jpg',
  //       price: 29,
  //       category: 'Clothing',
  //       quantity: 25,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5,
  //       orders: []
  //     },
  //     {
  //       id: '1004',
  //       code: 'h456wer53',
  //       name: 'Bracelet',
  //       description: 'Product Description',
  //       image: 'bracelet.jpg',
  //       price: 15,
  //       category: 'Accessories',
  //       quantity: 73,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1004-0',
  //           productCode: 'h456wer53',
  //           date: '2020-09-05',
  //           amount: 60,
  //           quantity: 4,
  //           customer: 'Mayumi Misaki',
  //           status: 'PENDING'
  //         },
  //         {
  //           id: '1004-1',
  //           productCode: 'h456wer53',
  //           date: '2019-04-16',
  //           amount: 2,
  //           quantity: 30,
  //           customer: 'Francesco Salvatore',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1005',
  //       code: 'av2231fwg',
  //       name: 'Brown Purse',
  //       description: 'Product Description',
  //       image: 'brown-purse.jpg',
  //       price: 120,
  //       category: 'Accessories',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1005-0',
  //           productCode: 'av2231fwg',
  //           date: '2020-01-25',
  //           amount: 120,
  //           quantity: 1,
  //           customer: 'Isabel Sinclair',
  //           status: 'RETURNED'
  //         },
  //         {
  //           id: '1005-1',
  //           productCode: 'av2231fwg',
  //           date: '2019-03-12',
  //           amount: 240,
  //           quantity: 2,
  //           customer: 'Lionel Clifford',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1005-2',
  //           productCode: 'av2231fwg',
  //           date: '2019-05-05',
  //           amount: 120,
  //           quantity: 1,
  //           customer: 'Cody Chavez',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1006',
  //       code: 'bib36pfvm',
  //       name: 'Chakra Bracelet',
  //       description: 'Product Description',
  //       image: 'chakra-bracelet.jpg',
  //       price: 32,
  //       category: 'Accessories',
  //       quantity: 5,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1006-0',
  //           productCode: 'bib36pfvm',
  //           date: '2020-02-24',
  //           amount: 32,
  //           quantity: 1,
  //           customer: 'Arvin Darci',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1006-1',
  //           productCode: 'bib36pfvm',
  //           date: '2020-01-14',
  //           amount: 64,
  //           quantity: 2,
  //           customer: 'Izzy Jones',
  //           status: 'PENDING'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1007',
  //       code: 'mbvjkgip5',
  //       name: 'Galaxy Earrings',
  //       description: 'Product Description',
  //       image: 'galaxy-earrings.jpg',
  //       price: 34,
  //       category: 'Accessories',
  //       quantity: 23,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5,
  //       orders: [
  //         {
  //           id: '1007-0',
  //           productCode: 'mbvjkgip5',
  //           date: '2020-06-19',
  //           amount: 34,
  //           quantity: 1,
  //           customer: 'Jennifer Smith',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1008',
  //       code: 'vbb124btr',
  //       name: 'Game Controller',
  //       description: 'Product Description',
  //       image: 'game-controller.jpg',
  //       price: 99,
  //       category: 'Electronics',
  //       quantity: 2,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1008-0',
  //           productCode: 'vbb124btr',
  //           date: '2020-01-05',
  //           amount: 99,
  //           quantity: 1,
  //           customer: 'Jeanfrancois David',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1008-1',
  //           productCode: 'vbb124btr',
  //           date: '2020-01-19',
  //           amount: 198,
  //           quantity: 2,
  //           customer: 'Ivar Greenwood',
  //           status: 'RETURNED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1009',
  //       code: 'cm230f032',
  //       name: 'Gaming Set',
  //       description: 'Product Description',
  //       image: 'gaming-set.jpg',
  //       price: 299,
  //       category: 'Electronics',
  //       quantity: 63,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1009-0',
  //           productCode: 'cm230f032',
  //           date: '2020-06-24',
  //           amount: 299,
  //           quantity: 1,
  //           customer: 'Kadeem Mujtaba',
  //           status: 'PENDING'
  //         },
  //         {
  //           id: '1009-1',
  //           productCode: 'cm230f032',
  //           date: '2020-05-11',
  //           amount: 299,
  //           quantity: 1,
  //           customer: 'Ashley Wickens',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1009-2',
  //           productCode: 'cm230f032',
  //           date: '2019-02-07',
  //           amount: 299,
  //           quantity: 1,
  //           customer: 'Julie Johnson',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1009-3',
  //           productCode: 'cm230f032',
  //           date: '2020-04-26',
  //           amount: 299,
  //           quantity: 1,
  //           customer: 'Tony Costa',
  //           status: 'CANCELLED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1010',
  //       code: 'plb34234v',
  //       name: 'Gold Phone Case',
  //       description: 'Product Description',
  //       image: 'gold-phone-case.jpg',
  //       price: 24,
  //       category: 'Accessories',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1010-0',
  //           productCode: 'plb34234v',
  //           date: '2020-02-04',
  //           amount: 24,
  //           quantity: 1,
  //           customer: 'James Butt',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1010-1',
  //           productCode: 'plb34234v',
  //           date: '2020-05-05',
  //           amount: 48,
  //           quantity: 2,
  //           customer: 'Josephine Darakjy',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1011',
  //       code: '4920nnc2d',
  //       name: 'Green Earbuds',
  //       description: 'Product Description',
  //       image: 'green-earbuds.jpg',
  //       price: 89,
  //       category: 'Electronics',
  //       quantity: 23,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1011-0',
  //           productCode: '4920nnc2d',
  //           date: '2020-06-01',
  //           amount: 89,
  //           quantity: 1,
  //           customer: 'Art Venere',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1012',
  //       code: '250vm23cc',
  //       name: 'Green T-Shirt',
  //       description: 'Product Description',
  //       image: 'green-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 74,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5,
  //       orders: [
  //         {
  //           id: '1012-0',
  //           productCode: '250vm23cc',
  //           date: '2020-02-05',
  //           amount: 49,
  //           quantity: 1,
  //           customer: 'Lenna Paprocki',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1012-1',
  //           productCode: '250vm23cc',
  //           date: '2020-02-15',
  //           amount: 49,
  //           quantity: 1,
  //           customer: 'Donette Foller',
  //           status: 'PENDING'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1013',
  //       code: 'fldsmn31b',
  //       name: 'Grey T-Shirt',
  //       description: 'Product Description',
  //       image: 'grey-t-shirt.jpg',
  //       price: 48,
  //       category: 'Clothing',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1013-0',
  //           productCode: 'fldsmn31b',
  //           date: '2020-04-01',
  //           amount: 48,
  //           quantity: 1,
  //           customer: 'Simona Morasca',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1014',
  //       code: 'waas1x2as',
  //       name: 'Headphones',
  //       description: 'Product Description',
  //       image: 'headphones.jpg',
  //       price: 175,
  //       category: 'Electronics',
  //       quantity: 8,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 5,
  //       orders: [
  //         {
  //           id: '1014-0',
  //           productCode: 'waas1x2as',
  //           date: '2020-05-15',
  //           amount: 175,
  //           quantity: 1,
  //           customer: 'Lenna Paprocki',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1014-1',
  //           productCode: 'waas1x2as',
  //           date: '2020-01-02',
  //           amount: 175,
  //           quantity: 1,
  //           customer: 'Donette Foller',
  //           status: 'CANCELLED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1015',
  //       code: 'vb34btbg5',
  //       name: 'Light Green T-Shirt',
  //       description: 'Product Description',
  //       image: 'light-green-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 34,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1015-0',
  //           productCode: 'vb34btbg5',
  //           date: '2020-07-02',
  //           amount: 98,
  //           quantity: 2,
  //           customer: 'Mitsue Tollner',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1016',
  //       code: 'k8l6j58jl',
  //       name: 'Lime Band',
  //       description: 'Product Description',
  //       image: 'lime-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 12,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 3,
  //       orders: []
  //     },
  //     {
  //       id: '1017',
  //       code: 'v435nn85n',
  //       name: 'Mini Speakers',
  //       description: 'Product Description',
  //       image: 'mini-speakers.jpg',
  //       price: 85,
  //       category: 'Clothing',
  //       quantity: 42,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1017-0',
  //           productCode: 'v435nn85n',
  //           date: '2020-07-12',
  //           amount: 85,
  //           quantity: 1,
  //           customer: 'Minna Amigon',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1018',
  //       code: '09zx9c0zc',
  //       name: 'Painted Phone Case',
  //       description: 'Product Description',
  //       image: 'painted-phone-case.jpg',
  //       price: 56,
  //       category: 'Accessories',
  //       quantity: 41,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5,
  //       orders: [
  //         {
  //           id: '1018-0',
  //           productCode: '09zx9c0zc',
  //           date: '2020-07-01',
  //           amount: 56,
  //           quantity: 1,
  //           customer: 'Abel Maclead',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1018-1',
  //           productCode: '09zx9c0zc',
  //           date: '2020-05-02',
  //           amount: 56,
  //           quantity: 1,
  //           customer: 'Minna Amigon',
  //           status: 'RETURNED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1019',
  //       code: 'mnb5mb2m5',
  //       name: 'Pink Band',
  //       description: 'Product Description',
  //       image: 'pink-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 63,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: []
  //     },
  //     {
  //       id: '1020',
  //       code: 'r23fwf2w3',
  //       name: 'Pink Purse',
  //       description: 'Product Description',
  //       image: 'pink-purse.jpg',
  //       price: 110,
  //       category: 'Accessories',
  //       quantity: 0,
  //       inventoryStatus: 'OUTOFSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1020-0',
  //           productCode: 'r23fwf2w3',
  //           date: '2020-05-29',
  //           amount: 110,
  //           quantity: 1,
  //           customer: 'Kiley Caldarera',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1020-1',
  //           productCode: 'r23fwf2w3',
  //           date: '2020-02-11',
  //           amount: 220,
  //           quantity: 2,
  //           customer: 'Graciela Ruta',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1021',
  //       code: 'pxpzczo23',
  //       name: 'Purple Band',
  //       description: 'Product Description',
  //       image: 'purple-band.jpg',
  //       price: 79,
  //       category: 'Fitness',
  //       quantity: 6,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1021-0',
  //           productCode: 'pxpzczo23',
  //           date: '2020-02-02',
  //           amount: 79,
  //           quantity: 1,
  //           customer: 'Cammy Albares',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1022',
  //       code: '2c42cb5cb',
  //       name: 'Purple Gemstone Necklace',
  //       description: 'Product Description',
  //       image: 'purple-gemstone-necklace.jpg',
  //       price: 45,
  //       category: 'Accessories',
  //       quantity: 62,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1022-0',
  //           productCode: '2c42cb5cb',
  //           date: '2020-06-29',
  //           amount: 45,
  //           quantity: 1,
  //           customer: 'Mattie Poquette',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1022-1',
  //           productCode: '2c42cb5cb',
  //           date: '2020-02-11',
  //           amount: 135,
  //           quantity: 3,
  //           customer: 'Meaghan Garufi',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1023',
  //       code: '5k43kkk23',
  //       name: 'Purple T-Shirt',
  //       description: 'Product Description',
  //       image: 'purple-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 2,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 5,
  //       orders: [
  //         {
  //           id: '1023-0',
  //           productCode: '5k43kkk23',
  //           date: '2020-04-15',
  //           amount: 49,
  //           quantity: 1,
  //           customer: 'Gladys Rim',
  //           status: 'RETURNED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1024',
  //       code: 'lm2tny2k4',
  //       name: 'Shoes',
  //       description: 'Product Description',
  //       image: 'shoes.jpg',
  //       price: 64,
  //       category: 'Clothing',
  //       quantity: 0,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: []
  //     },
  //     {
  //       id: '1025',
  //       code: 'nbm5mv45n',
  //       name: 'Sneakers',
  //       description: 'Product Description',
  //       image: 'sneakers.jpg',
  //       price: 78,
  //       category: 'Clothing',
  //       quantity: 52,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 4,
  //       orders: [
  //         {
  //           id: '1025-0',
  //           productCode: 'nbm5mv45n',
  //           date: '2020-02-19',
  //           amount: 78,
  //           quantity: 1,
  //           customer: 'Yuki Whobrey',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1025-1',
  //           productCode: 'nbm5mv45n',
  //           date: '2020-05-21',
  //           amount: 78,
  //           quantity: 1,
  //           customer: 'Fletcher Flosi',
  //           status: 'PENDING'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1026',
  //       code: 'zx23zc42c',
  //       name: 'Teal T-Shirt',
  //       description: 'Product Description',
  //       image: 'teal-t-shirt.jpg',
  //       price: 49,
  //       category: 'Clothing',
  //       quantity: 3,
  //       inventoryStatus: 'LOWSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1026-0',
  //           productCode: 'zx23zc42c',
  //           date: '2020-04-24',
  //           amount: 98,
  //           quantity: 2,
  //           customer: 'Bette Nicka',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1027',
  //       code: 'acvx872gc',
  //       name: 'Yellow Earbuds',
  //       description: 'Product Description',
  //       image: 'yellow-earbuds.jpg',
  //       price: 89,
  //       category: 'Electronics',
  //       quantity: 35,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 3,
  //       orders: [
  //         {
  //           id: '1027-0',
  //           productCode: 'acvx872gc',
  //           date: '2020-01-29',
  //           amount: 89,
  //           quantity: 1,
  //           customer: 'Veronika Inouye',
  //           status: 'DELIVERED'
  //         },
  //         {
  //           id: '1027-1',
  //           productCode: 'acvx872gc',
  //           date: '2020-06-11',
  //           amount: 89,
  //           quantity: 1,
  //           customer: 'Willard Kolmetz',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     },
  //     {
  //       id: '1028',
  //       code: 'tx125ck42',
  //       name: 'Yoga Mat',
  //       description: 'Product Description',
  //       image: 'yoga-mat.jpg',
  //       price: 20,
  //       category: 'Fitness',
  //       quantity: 15,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 5,
  //       orders: []
  //     },
  //     {
  //       id: '1029',
  //       code: 'gwuby345v',
  //       name: 'Yoga Set',
  //       description: 'Product Description',
  //       image: 'yoga-set.jpg',
  //       price: 20,
  //       category: 'Fitness',
  //       quantity: 25,
  //       inventoryStatus: 'INSTOCK',
  //       rating: 8,
  //       orders: [
  //         {
  //           id: '1029-0',
  //           productCode: 'gwuby345v',
  //           date: '2020-02-14',
  //           amount: 4,
  //           quantity: 80,
  //           customer: 'Maryann Royster',
  //           status: 'DELIVERED'
  //         }
  //       ]
  //     }
  //   ];
  // }
  //
  // getProductsMini() {
  //   return Promise.resolve(this.getProductsData().slice(0, 5));
  // }
  //
  // getProductsSmall() {
  //   return Promise.resolve(this.getProductsData().slice(0, 10));
  // }
  //
  // getProducts() {
  //   return Promise.resolve(this.getProductsData());
  // }
  //
  // getProductsWithOrdersSmall() {
  //   return Promise.resolve(this.getProductsWithOrdersData().slice(0, 10));
  // }
  //
  // getProductsWithOrders() {
  //   return Promise.resolve(this.getProductsWithOrdersData());
  // }

}
