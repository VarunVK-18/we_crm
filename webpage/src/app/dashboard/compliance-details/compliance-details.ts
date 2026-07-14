import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../api';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  ArrowLeft01Icon, 
  CheckmarkCircle01Icon, 
  Alert01Icon, 
  DocumentAttachmentIcon,
  Calendar02Icon,
  UserIcon,
  Building03Icon
} from '@hugeicons/core-free-icons';
import { WeLoaderComponent } from '../../components/we-loader/we-loader';

@Component({
  selector: 'app-compliance-details',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent, WeLoaderComponent],
  templateUrl: './compliance-details.html',
  styleUrl: './compliance-details.css'
})
export class ComplianceDetails implements OnInit, OnDestroy {
  readonly ArrowLeft01Icon = ArrowLeft01Icon;
  readonly CheckmarkCircle01Icon = CheckmarkCircle01Icon;
  readonly Alert01Icon = Alert01Icon;
  readonly DocumentAttachmentIcon = DocumentAttachmentIcon;
  readonly Calendar02Icon = Calendar02Icon;
  readonly UserIcon = UserIcon;
  readonly Building03Icon = Building03Icon;

  taskId = signal<string | null>(null);
  task = signal<any>(null);
  isLoading = signal<boolean>(true);

  // File Upload State for Complete Task
  isCompleteModalOpen = signal(false);
  proofDocument: File | null = null;
  certificateDocument: File | null = null;
  acknowledgementDocument: File | null = null;

  private routeSub: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: Api
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.taskId.set(id);
        this.fetchTaskDetails(id);
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/staff-compliance']);
  }

  fetchTaskDetails(id: string) {
    this.isLoading.set(true);
    this.api.get<any>(`compliance/tasks/details/${id}`).subscribe({
      next: (res) => {
        this.task.set(res.task);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch compliance task details', err);
        this.isLoading.set(false);
      }
    });
  }

  openCompleteModal() {
    this.proofDocument = null;
    this.certificateDocument = null;
    this.acknowledgementDocument = null;
    this.isCompleteModalOpen.set(true);
  }

  onFileChange(event: any, type: string) {
    const file = event.target.files[0];
    if (file) {
      if (type === 'proof') this.proofDocument = file;
      if (type === 'cert') this.certificateDocument = file;
      if (type === 'ack') this.acknowledgementDocument = file;
    }
  }

  submitCompletion() {
    if (!this.taskId()) return;
    const formData = new FormData();
    if (this.proofDocument) formData.append('proofDocument', this.proofDocument);
    if (this.certificateDocument) formData.append('certificateDocument', this.certificateDocument);
    if (this.acknowledgementDocument) formData.append('acknowledgementDocument', this.acknowledgementDocument);

    this.api.post(`compliance/tasks/${this.taskId()}/complete`, formData).subscribe({
      next: () => {
        this.isCompleteModalOpen.set(false);
        this.fetchTaskDetails(this.taskId()!);
      },
      error: (err: any) => console.error('Failed to complete task:', err)
    });
  }
}
