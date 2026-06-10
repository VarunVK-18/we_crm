import { Injectable, signal } from '@angular/core';
import { Api } from '../../api';

export interface Notification {
  _id: string;
  id?: string;
  client_id: string;
  title: string;
  message: string;
  type: string;
  orderId?: string;
  serviceName?: string;
  isRead: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  private fetchInterval: any;

  constructor(private api: Api) {}

  startPolling() {
    this.fetchNotifications();
    if (!this.fetchInterval) {
      this.fetchInterval = setInterval(() => {
        this.fetchNotifications();
      }, 5000); // 5 seconds
    }
  }

  stopPolling() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
  }

  fetchNotifications() {
    this.api.get<any>('notifications').subscribe({
      next: (res) => {
        if (res && res.notifications) {
          const list = res.notifications.map((n: any) => ({
            ...n,
            orderId: n.order_id ? (n.order_id._id || n.order_id) : undefined,
            serviceName: n.order_id?.service_name || 'Service',
            timestamp: n.createdAt
          }));
          this.notifications.set(list);
          this.unreadCount.set(list.filter((n: Notification) => !n.isRead).length);
        }
      },
      error: (err) => console.error('Failed to fetch notifications', err)
    });
  }

  markAllAsRead() {
    if (this.unreadCount() === 0) return;
    this.api.put('notifications/read', {}).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      },
      error: (err) => console.error('Failed to mark notifications read', err)
    });
  }

  clearAll() {
    this.api.delete('notifications').subscribe({
      next: () => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      },
      error: (err) => console.error('Failed to clear notifications', err)
    });
  }

  clearNotification(id: string) {
    this.api.delete(`notifications/${id}`).subscribe({
      next: () => {
        this.notifications.update(list => {
          const filtered = list.filter(n => n._id !== id && n.id !== id);
          this.unreadCount.set(filtered.filter(n => !n.isRead).length);
          return filtered;
        });
      },
      error: (err) => console.error('Failed to clear notification', err)
    });
  }
}
