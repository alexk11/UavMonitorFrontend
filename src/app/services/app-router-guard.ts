// import {inject, Injectable} from "@angular/core";
// import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from "@angular/router";
//
// @Injectable({
//   providedIn: 'root'
// })
// class RouterService {
//
//   constructor(private router: Router) {}
//
//   canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
//       this.router.navigateByUrl(state.url, {skipLocationChange: true}).then();
//       return false;
//   }
// }
//
// export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean => {
//   return inject(RouterService).canActivate(next, state);
// }
