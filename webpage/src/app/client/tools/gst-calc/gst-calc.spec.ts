import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GstCalc } from './gst-calc';

describe('GstCalc', () => {
  let component: GstCalc;
  let fixture: ComponentFixture<GstCalc>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GstCalc],
    }).compileComponents();

    fixture = TestBed.createComponent(GstCalc);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
