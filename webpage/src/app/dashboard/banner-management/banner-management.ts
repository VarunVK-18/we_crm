import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../api';

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  theme?: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  targetAudience?: string;
  priority?: number;
  clickCount?: number;
  createdAt: string;
}

@Component({
  selector: 'app-banner-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './banner-management.html',
  styleUrls: ['./banner-management.css']
})
export class BannerManagement implements OnInit {
  banners: Banner[] = [];
  isLoading = true;
  error = '';
  
  newBannerTitle = '';
  newBannerSubtitle = '';
  newBannerButtonText = '';
  newBannerTheme = 'purple';
  newBannerTargetUrl = '';
  newBannerStartDate = '';
  newBannerEndDate = '';
  newBannerTargetAudience = 'All';
  newBannerPriority = 0;
  newBannerImage: File | null = null;
  isUploading = false;
  previewUrl: string | null = null;

  constructor(public api: Api) {}

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    this.isLoading = true;
    this.api.get<any>('banners?all=true').subscribe({
      next: (res) => {
        this.banners = res.banners || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load banners';
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newBannerImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  createBanner() {
    if (!this.newBannerTitle || !this.newBannerImage) {
      alert(`Please provide a title and an image. Title: "${this.newBannerTitle}", Image: ${this.newBannerImage ? 'Selected' : 'Missing'}`);
      return;
    }
    this.isUploading = true;
    const formData = new FormData();
    formData.append('title', this.newBannerTitle);
    formData.append('subtitle', this.newBannerSubtitle);
    formData.append('buttonText', this.newBannerButtonText);
    formData.append('theme', this.newBannerTheme);
    formData.append('targetUrl', this.newBannerTargetUrl);
    if (this.newBannerStartDate) formData.append('startDate', this.newBannerStartDate);
    if (this.newBannerEndDate) formData.append('endDate', this.newBannerEndDate);
    formData.append('targetAudience', this.newBannerTargetAudience);
    formData.append('priority', this.newBannerPriority.toString());
    formData.append('file', this.newBannerImage);
    
    this.api.post<any>('banners', formData).subscribe({
      next: (res) => {
        if (res.success) {
          this.banners.unshift(res.banner);
          this.newBannerTitle = '';
          this.newBannerSubtitle = '';
          this.newBannerButtonText = '';
          this.newBannerTheme = 'purple';
          this.newBannerTargetUrl = '';
          this.newBannerStartDate = '';
          this.newBannerEndDate = '';
          this.newBannerTargetAudience = 'All';
          this.newBannerPriority = 0;
          this.newBannerImage = null;
          this.previewUrl = null;
          // Reset file input via DOM if needed, but Angular binding might handle it or we can ignore
        }
        this.isUploading = false;
      },
      error: (err) => {
        console.error(err);
        alert('Failed to create banner');
        this.isUploading = false;
      }
    });
  }

  toggleActive(banner: Banner) {
    const originalState = banner.isActive;
    banner.isActive = !banner.isActive;
    
    const formData = new FormData();
    formData.append('isActive', banner.isActive.toString());
    
    this.api.put<any>(`banners/${banner._id}`, formData).subscribe({
      next: (res) => {
        if (!res.success) {
          banner.isActive = originalState;
        }
      },
      error: (err) => {
        banner.isActive = originalState;
        console.error(err);
        alert('Failed to update banner');
      }
    });
  }

  deleteBanner(banner: Banner) {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    
    this.api.delete<any>(`banners/${banner._id}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.banners = this.banners.filter(b => b._id !== banner._id);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Failed to delete banner');
      }
    });
  }
}
