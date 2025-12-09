import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarComponent } from './agregar.component';

describe('Agregar', () => {
  let component: AgregarComponent;
  let fixture: ComponentFixture<AgregarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
