import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { HttpService } from './http.service';
import { MessageService } from './message.service';
import { AppConfigService } from './config.service';
import { User } from '../model/user';
import { Vehicle } from '../model/vehicle';
import { UavInfo } from '../model/uav-info';
import { UavTO } from '../model/uav-to';
import { UavFailure } from '../model/uav-failure';
import { UavFailureStep } from '../model/uav-failure-step';
import { Activity } from '../model/activity';

describe('HttpService', () => {
  let service: HttpService;
  let httpMock: HttpTestingController;
  let messageService: jasmine.SpyObj<MessageService>;
  let router: jasmine.SpyObj<Router>;
  let appConfigService: AppConfigService;

  const mockBackUrl = 'http://localhost:8080';
  const mockAuthToken = 'test-token-123';

  // Helper function to match requests by URL
  const matchUrl = (url: string) => (req: any) => req.url === url;

  beforeEach(() => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpService,
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: Router, useValue: routerSpy },
        AppConfigService
      ]
    });

    service = TestBed.inject(HttpService);
    httpMock = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    appConfigService = TestBed.inject(AppConfigService);

    // Initialize config
    appConfigService.initialize();
  });

  afterEach(() => {
    httpMock.verify(); // Verify that there are no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Authentication', () => {
    describe('login', () => {
      it('should send login credentials and return auth response', () => {
        const loginInput = { login: 'testuser', password: 'testpass' };
        const mockResponse = { token: mockAuthToken, role: 'ADMIN' };

        service.login(loginInput).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/login`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(loginInput);
        req.flush(mockResponse);

        expect(messageService.add).toHaveBeenCalledWith('User "testuser" logged in');
      });

      it('should handle login error', () => {
        const loginInput = { login: 'testuser', password: 'wrongpass' };
        const mockError = { status: 401, statusText: 'Unauthorized' };

        service.login(loginInput).subscribe(response => {
          expect(response).toEqual([]);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/login`);
        req.flush(null, mockError);

        expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('login failed'));
      });
    });

    describe('setAuthParams', () => {
      it('should set auth token and user role', () => {
        const authData = { token: mockAuthToken, role: 'ADMIN' };

        service.setAuthParams(authData);

        expect(appConfigService.getConfig().authToken).toBe(mockAuthToken);
        expect(appConfigService.getConfig().userRole).toBe('ADMIN');
      });

      it('should clear auth params when passed null', () => {
        service.setAuthParams(null);

        expect(appConfigService.getConfig().authToken).toBe('');
        expect(appConfigService.getConfig().userRole).toBe('');
      });

      it('should handle partial auth data', () => {
        const authData = { token: mockAuthToken, role: null };

        service.setAuthParams(authData);

        expect(appConfigService.getConfig().authToken).toBe(mockAuthToken);
        expect(appConfigService.getConfig().userRole).toBe('');
      });
    });
  });

  describe('Vehicle Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getVehicles', () => {
      it('should retrieve vehicles with auth header', () => {
        const mockVehicles: Vehicle[] = [
          { id: 1, type: 'Drone', vehicleId: 'UAV001', description: 'Test drone' }
        ];

        service.getVehicles().subscribe(vehicles => {
          expect(vehicles).toEqual(mockVehicles);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getVehicles`);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockAuthToken}`);
        req.flush(mockVehicles);
      });

      it('should handle error when fetching vehicles', () => {
        service.getVehicles().subscribe(vehicles => {
          expect(vehicles).toEqual([]);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getVehicles`);
        req.flush(null, { status: 500, statusText: 'Server Error' });

        expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('getVehicles failed'));
      });
    });

    describe('addVehicle', () => {
      it('should add a new vehicle', () => {
        const newVehicle: Vehicle = {
          id: 2,
          type: 'Quadcopter',
          vehicleId: 'UAV002',
          description: 'New test drone'
        };

        service.addVehicle(newVehicle).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/addUav`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newVehicle);
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockAuthToken}`);
        req.flush({});

        expect(messageService.add).toHaveBeenCalledWith(`Created vehicle id=${newVehicle.vehicleId}`);
      });
    });

    describe('deleteVehicles', () => {
      it('should delete vehicles', () => {
        const vehiclesToDelete: Vehicle[] = [
          { id: 1, type: 'Drone', vehicleId: 'UAV001', description: 'Test drone' }
        ];

        service.deleteVehicles(vehiclesToDelete).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deleteUavs`);
        expect(req.request.method).toBe('DELETE');
        expect(req.request.body).toEqual(vehiclesToDelete);
        req.flush({});

        expect(messageService.add).toHaveBeenCalledWith('Vehicle(s) deleted.');
      });
    });
  });

  describe('User Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getUsers', () => {
      it('should retrieve users with auth header', () => {
        const mockUsers: User[] = [
          { id: 1, login: 'user1', surname: 'Doe', lastname: 'John', role: 'USER', enabled: true } as User
        ];

        service.getUsers().subscribe(users => {
          expect(users).toEqual(mockUsers);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getUsers`);
        expect(req.request.method).toBe('GET');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockAuthToken}`);
        req.flush(mockUsers);
      });
    });

    describe('getUser', () => {
      it('should retrieve a single user by login', () => {
        const mockUser: User = {
          id: 1,
          login: 'testuser',
          surname: 'Doe',
          lastname: 'John',
          role: 'USER',
          enabled: true
        } as User;

        service.getUser('testuser').subscribe(user => {
          expect(user).toEqual(mockUser);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getUser/testuser`);
        expect(req.request.method).toBe('GET');
        req.flush(mockUser);

        expect(messageService.add).toHaveBeenCalledWith("Fetched user name='testuser'");
      });
    });

    describe('addUser', () => {
      it('should add a new user', () => {
        const newUser: User = {
          id: 2,
          login: 'newuser',
          surname: 'Smith',
          lastname: 'Jane',
          password: 'pass123',
          role: 'USER',
          enabled: true
        } as User;

        service.addUser(newUser).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/register`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newUser);
        req.flush({});

        expect(messageService.add).toHaveBeenCalledWith(`Created user id=${newUser.id}`);
      });
    });

    describe('updateUser', () => {
      it('should update an existing user', () => {
        const updatedUser: User = {
          id: 1,
          login: 'testuser',
          surname: 'Doe',
          lastname: 'John',
          role: 'ADMIN',
          enabled: true
        } as User;

        service.updateUser(updatedUser).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/updateUser`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(updatedUser);
        req.flush({});
      });
    });

    describe('deleteUsers', () => {
      it('should delete users', () => {
        const usersToDelete: User[] = [
          { id: 1, login: 'user1' } as User
        ];

        service.deleteUsers(usersToDelete).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deleteUsers`);
        expect(req.request.method).toBe('DELETE');
        expect(req.request.body).toEqual(usersToDelete);
        req.flush({});

        expect(messageService.add).toHaveBeenCalledWith('Users deleted.');
      });
    });
  });

  describe('UAV Info Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getUavInfo', () => {
      it('should retrieve UAV info by ID', () => {
        const mockUavInfo: UavInfo = { uavId: 'UAV001' } as UavInfo;

        service.getUavInfo('UAV001').subscribe(info => {
          expect(info).toEqual(mockUavInfo);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getUavInfo/UAV001`);
        expect(req.request.method).toBe('GET');
        req.flush(mockUavInfo);
      });
    });

    describe('postUavInfo', () => {
      it('should post UAV info', () => {
        const uavInfo: UavInfo = { uavId: 'UAV001' } as UavInfo;

        service.postUavInfo(uavInfo).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/postUavInfo`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(uavInfo);
        req.flush(uavInfo);
      });
    });
  });

  describe('PDF Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('downloadPdf', () => {
      it('should download PDF document', () => {
        const mockPdfData = new ArrayBuffer(8);

        service.downloadPdf('UAV001', 'insurance').subscribe(data => {
          expect(data).toEqual(mockPdfData);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/downloadPdf/UAV001/insurance`);
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('arraybuffer');
        req.flush(mockPdfData);
      });
    });

    describe('uploadPdf', () => {
      it('should upload PDF document', () => {
        const pdfData = new FormData();

        service.uploadPdf('UAV001', 'insurance', pdfData).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/uploadPdf/UAV001/insurance`);
        expect(req.request.method).toBe('POST');
        req.flush({});
      });
    });

    describe('deletePdf', () => {
      it('should delete PDF document', () => {
        service.deletePdf('UAV001', 'insurance').subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deletePdf/UAV001/insurance`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
      });
    });
  });

  describe('Image Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('uploadImage', () => {
      it('should upload an image', () => {
        const imageData = new FormData();

        service.uploadImage('UAV001', imageData).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/uploadImage/UAV001`);
        expect(req.request.method).toBe('POST');
        req.flush({});
      });
    });

    describe('deleteImage', () => {
      it('should delete an image by ID', () => {
        service.deleteImage(123).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deleteImage/123`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
      });
    });

    describe('fetchImageDBIds', () => {
      it('should fetch image IDs for a UAV', () => {
        const mockIds = [1, 2, 3];

        service.fetchImageDBIds('UAV001').subscribe(ids => {
          expect(ids).toEqual(mockIds);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/fetchImageIds/UAV001`);
        expect(req.request.method).toBe('GET');
        req.flush(mockIds);
      });
    });

    describe('downloadOneImage', () => {
      it('should download a single image', () => {
        const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

        service.downloadOneImage(123).subscribe(blob => {
          expect(blob).toEqual(mockBlob);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/downloadOneImage/123`);
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('blob');
        req.flush(mockBlob);
      });
    });
  });

  describe('UAV TO Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getUavTOs', () => {
      it('should retrieve UAV TOs', () => {
        const mockTOs: UavTO[] = [{ uavId: 'UAV001' } as UavTO];

        service.getUavTOs('UAV001').subscribe(tos => {
          expect(tos).toEqual(mockTOs);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getUavTOs/UAV001`);
        expect(req.request.method).toBe('GET');
        req.flush(mockTOs);
      });
    });

    describe('saveUavTO', () => {
      it('should save UAV TO', () => {
        const uavTO: UavTO = { uavId: 'UAV001' } as UavTO;

        service.saveUavTO(uavTO).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/saveUavTO`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(uavTO);
        req.flush(uavTO);
      });
    });

    describe('deleteUavTO', () => {
      it('should delete UAV TO', () => {
        const uavTO: UavTO = { uavId: 'UAV001' } as UavTO;

        service.deleteUavTO(uavTO).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deleteUavTO`);
        expect(req.request.method).toBe('DELETE');
        expect(req.request.body).toEqual(uavTO);
        req.flush({});
      });
    });
  });

  describe('UAV Failure Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getUavFailures', () => {
      it('should retrieve UAV failures', () => {
        const mockFailures: UavFailure[] = [{ uavId: 'UAV001', recordId: 1 } as UavFailure];

        service.getUavFailures('UAV001').subscribe(failures => {
          expect(failures).toEqual(mockFailures);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/fetchUavFailures/UAV001`);
        expect(req.request.method).toBe('GET');
        req.flush(mockFailures);
      });
    });

    describe('saveUavFailure', () => {
      it('should save UAV failure', () => {
        const failure: UavFailure = { uavId: 'UAV001', recordId: 1 } as UavFailure;

        service.saveUavFailure(failure).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/saveUavFailure`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(failure);
        req.flush(failure);
      });
    });

    describe('deleteUavFailure', () => {
      it('should delete UAV failure', () => {
        const failure: UavFailure = { uavId: 'UAV001', recordId: 1 } as UavFailure;

        service.deleteUavFailure(failure).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deleteUavFailure/UAV001/1`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
      });
    });
  });

  describe('UAV Failure Step Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getUavFailureHistory', () => {
      it('should retrieve UAV failure history', () => {
        const mockSteps: UavFailureStep[] = [{
          id: 1,
          failureId: 1,
          recordId: 1,
          uavId: 'UAV001',
          date: '2025-12-02',
          contactPerson: 'John Doe',
          importance: 'High',
          description: 'Test failure step'
        }];

        service.getUavFailureHistory('UAV001', 1).subscribe(steps => {
          expect(steps).toEqual(mockSteps);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/fetchFailureSteps/UAV001/1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockSteps);
      });
    });

    describe('saveUavFailureStep', () => {
      it('should save UAV failure step', () => {
        const step: UavFailureStep = {
          id: 1,
          failureId: 1,
          recordId: 1,
          uavId: 'UAV001',
          date: '2025-12-02',
          contactPerson: 'John Doe',
          importance: 'High',
          description: 'Test failure step'
        };

        service.saveUavFailureStep(step).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/saveFailureStep`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(step);
        req.flush(step);
      });
    });

    describe('deleteUavFailureStep', () => {
      it('should delete UAV failure step', () => {
        service.deleteUavFailureStep(1, 1).subscribe();

        const req = httpMock.expectOne(`${mockBackUrl}/deleteFailureStep/1/1`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
      });
    });
  });

  describe('Activity Methods', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    describe('getActivities', () => {
      it('should retrieve activities', () => {
        const mockActivities: Activity[] = [{ id: 1 } as Activity];

        service.getActivities().subscribe(activities => {
          expect(activities).toEqual(mockActivities);
        });

        const req = httpMock.expectOne(`${mockBackUrl}/getEvents`);
        expect(req.request.method).toBe('GET');
        req.flush(mockActivities);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      service.setAuthParams({ token: mockAuthToken, role: 'ADMIN' });
    });

    it('should handle 401 Unauthorized error and redirect to login', () => {
      service.getVehicles().subscribe();

      const req = httpMock.expectOne(`${mockBackUrl}/getVehicles`);
      req.flush('Unauthorized path', { status: 401, statusText: 'Unauthorized', headers: { 'Content-Type': 'text/plain' } });

      expect(router.navigate).toHaveBeenCalledWith(['login'], { skipLocationChange: true });
    });

    it('should set error message on HTTP error', () => {
      const errorMessage = 'Server error occurred';

      service.getVehicles().subscribe();

      const req = httpMock.expectOne(`${mockBackUrl}/getVehicles`);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });

      expect(service.errorMessage).toContain('Ошибка:');
    });

    it('should log error message to message service', () => {
      service.getVehicles().subscribe();

      const req = httpMock.expectOne(`${mockBackUrl}/getVehicles`);
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(messageService.add).toHaveBeenCalledWith(jasmine.stringContaining('getVehicles failed'));
    });
  });

  describe('Logging', () => {
    it('should log messages via message service', () => {
      service.log('Test message');

      expect(messageService.add).toHaveBeenCalledWith('HttpService: Test message');
    });
  });
});
