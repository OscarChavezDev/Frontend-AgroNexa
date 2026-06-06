import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { PopupService, PopupData } from '../../services/popup.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss'],
  standalone: false
})
export class PopupComponent implements OnInit, OnDestroy {
  public data: PopupData | null = null;
  private sub: Subscription | null = null;
  private timeoutId: any;

  constructor(private popupService: PopupService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {
    this.sub = this.popupService.popup$.subscribe(data => {
      this.data = data;
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      // Auto close after 2 seconds
      this.ngZone.runOutsideAngular(() => {
        this.timeoutId = setTimeout(() => {
          this.ngZone.run(() => {
            this.close();
          });
        }, 2000);
      });
      this.cdr.detectChanges();
    });
  }

  close() {
    this.data = null;
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}
