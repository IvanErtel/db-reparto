import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarComponent } from './editar.component';

describe('Editar', () => {
  let component: EditarComponent;
  let fixture: ComponentFixture<EditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
