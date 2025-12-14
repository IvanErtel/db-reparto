import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenReparto } from './resumen-reparto';

describe('ResumenReparto', () => {
  let component: ResumenReparto;
  let fixture: ComponentFixture<ResumenReparto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenReparto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenReparto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
