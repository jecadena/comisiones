import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {
  private rolUsuarioSubject = new BehaviorSubject<string>('');

  constructor() { }

  setRolUsuario(rol: string) {
    this.rolUsuarioSubject.next(rol);
  }

  getRolUsuario() {
    return this.rolUsuarioSubject.asObservable();
  }
}
