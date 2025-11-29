import { InjectionToken } from "@angular/core";

export let APP_CONFIG = new InjectionToken("app.config");

export interface IAppConfig {
  backUrl: string;
}

export const AppConfig: IAppConfig = {
  backUrl: "http://localhost:8080"
};
