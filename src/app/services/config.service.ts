import {Injectable} from "@angular/core";

export interface AppConfig {
  backUrl: string;
  authToken: string;
  userRole: string;
  enabled: boolean;
}

@Injectable()
export class AppConfigService {

  private config: AppConfig = {authToken: "", backUrl: "", userRole: "", enabled: false};

  public initialize() {
    this.config.backUrl = "http://localhost:8080";
  }

  public getConfig(): AppConfig {
    return this.config;
  }

}
