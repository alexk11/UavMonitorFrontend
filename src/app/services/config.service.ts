import {Injectable} from "@angular/core";

export interface AppConfig {
  backUrl: string;
  authToken: string;
  userName: string;
  userRole: string;
  enabled: boolean;
}

@Injectable()
export class AppConfigService {

  //private readonly backUrl: string = "http://192.168.18.151:8080/uav-montor-backend";
  private readonly backUrl: string = "http://localhost:8080";

  private config: AppConfig = {authToken: "", backUrl: "", userName: "", userRole: "", enabled: false};

  public initialize() {
    this.config.backUrl = this.backUrl;
  }

  public getConfig(): AppConfig {
    return this.config;
  }

}
