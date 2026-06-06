import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsCalc } from './tds-calc';

describe('TdsCalc', () => {
  let component: TdsCalc;
  let fixture: ComponentFixture<TdsCalc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdsCalc],
    }).compileComponents();

    fixture = TestBed.createComponent(TdsCalc);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
