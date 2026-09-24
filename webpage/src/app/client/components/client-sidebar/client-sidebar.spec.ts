import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientSidebarComponent as ClientSidebar } from './client-sidebar';

describe('ClientSidebar', () => {
  let component: ClientSidebar;
  let fixture: ComponentFixture<ClientSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientSidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
