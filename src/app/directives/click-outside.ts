import { Directive, ElementRef, Output, EventEmitter, HostListener } from '@angular/core';


@Directive({
    selector: '[clickOutside]'
})
export class ClickOutsideDirective {

    @Output() clickOutside = new EventEmitter<void>();

    constructor(private elementRef: ElementRef) {}

    @HostListener('document:click', ['$event.target'])
    public onClick(targetElement: HTMLElement): void {
        const clickedInside = this.elementRef.nativeElement.contains(targetElement);
        if (!clickedInside) {
            //console.log("ClickOutside event outside", targetElement);
            this.clickOutside.emit();
        }
    }

}
