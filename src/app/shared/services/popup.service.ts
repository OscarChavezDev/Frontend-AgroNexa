import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PopupData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupSubject = new Subject<PopupData>();
  public popup$ = this.popupSubject.asObservable();

  success(title: string, message: string) {
    this.popupSubject.next({ title, message, type: 'success' });
  }

  error(title: string, message: string) {
    this.popupSubject.next({ title, message, type: 'error' });
  }

  info(title: string, message: string) {
    this.popupSubject.next({ title, message, type: 'info' });
  }
}
