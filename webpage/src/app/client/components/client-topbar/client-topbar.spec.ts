import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientTopbarComponent as ClientTopbar } from './client-topbar';

describe('ClientTopbar', () => {
  let component: ClientTopbar;
  let fixture: ComponentFixture<ClientTopbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientTopbar],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientTopbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
