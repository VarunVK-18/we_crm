import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GstForm } from './gst-form';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('GstForm', () => {
  let component: GstForm;
  let fixture: ComponentFixture<GstForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GstForm],
      providers: [
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(GstForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
