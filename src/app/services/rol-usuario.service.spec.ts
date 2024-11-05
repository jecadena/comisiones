import { TestBed } from '@angular/core/testing';

import { RolUsuarioService } from './rol-usuario.service';

describe('RolUsuarioService', () => {
  let service: RolUsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RolUsuarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
