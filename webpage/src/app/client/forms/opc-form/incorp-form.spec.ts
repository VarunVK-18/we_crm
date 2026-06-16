import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncorpForm } from './incorp-form';

describe('IncorpForm', () => {
  let component: IncorpForm;
  let fixture: ComponentFixture<IncorpForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncorpForm],
    }).compileComponents();

    fixture = TestBed.createComponent(IncorpForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
