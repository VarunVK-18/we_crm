import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appResizableColumn]',
  standalone: true
})
export class ResizableColumnDirective implements OnInit {
  @Input('appResizableColumn') colId!: string;

  private resizer!: HTMLElement;
  private startX = 0;
  private startWidth = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (!this.colId) {
      console.warn('appResizableColumn requires a unique column ID');
      return;
    }

    // Set host position relative to hold the absolute resizer
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');
    this.renderer.setStyle(this.el.nativeElement, 'white-space', 'nowrap');
    
    // Check local storage for saved width
    const savedWidth = localStorage.getItem(`col-width-${this.colId}`);
    if (savedWidth) {
      this.renderer.setStyle(this.el.nativeElement, 'width', `${savedWidth}px`);
      this.renderer.setStyle(this.el.nativeElement, 'min-width', `${savedWidth}px`);
      this.renderer.setStyle(this.el.nativeElement, 'max-width', `${savedWidth}px`);
    }

    // Create drag handle
    this.resizer = this.renderer.createElement('div');
    this.renderer.setStyle(this.resizer, 'width', '5px');
    this.renderer.setStyle(this.resizer, 'position', 'absolute');
    this.renderer.setStyle(this.resizer, 'top', '0');
    this.renderer.setStyle(this.resizer, 'right', '0');
    this.renderer.setStyle(this.resizer, 'bottom', '0');
    this.renderer.setStyle(this.resizer, 'cursor', 'col-resize');
    this.renderer.setStyle(this.resizer, 'z-index', '1');
    // Optional: visual indicator on hover
    this.renderer.listen(this.resizer, 'mouseenter', () => {
      this.renderer.setStyle(this.resizer, 'background-color', 'rgba(99, 102, 241, 0.5)'); // Indigo color
    });
    this.renderer.listen(this.resizer, 'mouseleave', () => {
      this.renderer.setStyle(this.resizer, 'background-color', 'transparent');
    });

    this.renderer.appendChild(this.el.nativeElement, this.resizer);

    // Listen to mousedown on the handle
    this.renderer.listen(this.resizer, 'mousedown', this.onMouseDown.bind(this));
  }

  private onMouseDown(event: MouseEvent) {
    event.preventDefault(); // Prevent text selection
    this.startX = event.clientX;
    this.startWidth = this.el.nativeElement.offsetWidth;

    // Add listeners to document
    const mouseMoveListener = this.renderer.listen('document', 'mousemove', this.onMouseMove.bind(this));
    const mouseUpListener = this.renderer.listen('document', 'mouseup', (e: MouseEvent) => {
      this.onMouseUp();
      // Remove listeners
      mouseMoveListener();
      mouseUpListener();
    });
  }

  private onMouseMove(event: MouseEvent) {
    const deltaX = event.clientX - this.startX;
    const newWidth = Math.max(50, this.startWidth + deltaX); // min width 50px
    this.renderer.setStyle(this.el.nativeElement, 'width', `${newWidth}px`);
    this.renderer.setStyle(this.el.nativeElement, 'min-width', `${newWidth}px`);
    this.renderer.setStyle(this.el.nativeElement, 'max-width', `${newWidth}px`);
  }

  private onMouseUp() {
    const finalWidth = this.el.nativeElement.offsetWidth;
    if (this.colId) {
      localStorage.setItem(`col-width-${this.colId}`, finalWidth.toString());
    }
  }
}
