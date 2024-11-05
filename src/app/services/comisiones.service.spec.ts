import { TestBed } from '@angular/core/testing';

import { ComisionesService } from './comisiones.service';

describe('ComisionesService', () => {
  let service: ComisionesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComisionesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
