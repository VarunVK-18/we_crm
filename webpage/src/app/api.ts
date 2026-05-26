import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly baseUrl = 'http://localhost:5001/api';

  get serverUrl(): string {
    return this.baseUrl.replace(/\/api$/, '') + '/';
  }

  getFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('data:')) return fileUrl;
    return this.serverUrl + fileUrl.replace(/^\//, '');
  }

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const savedUser = localStorage.getItem('user');
    let userId = '';
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        userId = u._id || '';
      } catch (e) {}
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-user-id': userId
    });
  }

  /**
   * Authenticate a user with email and password
   * @param email User email address
   * @param password User password
   */
  login(email: string, password: string): Observable<any> {
    const url = `${this.baseUrl}/login`;
    const body = { email, password };
    return this.http.post<any>(url, body, { headers: this.getHeaders() });
  }

  register(userData: any): Observable<any> {
    const url = `${this.baseUrl}/register`;
    const savedUser = localStorage.getItem('user');
    let userId = '';
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        userId = u._id || '';
      } catch (e) {}
    }
    if (userData instanceof FormData) {
      const headers = new HttpHeaders({ 'x-user-id': userId });
      return this.http.post<any>(url, userData, { headers });
    }
    return this.http.post<any>(url, userData, { headers: this.getHeaders() });
  }

  /**
   * Fetch a user's profile details by ID
   * @param userId The unique User ID
   */
  getUserProfile(userId: string): Observable<any> {
    const url = `${this.baseUrl}/users/profile/${userId}`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  /**
   * General purpose POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const isFormData = body instanceof FormData || (body && typeof body.append === 'function' && typeof body.delete === 'function');
    if (isFormData) {
      const savedUser = localStorage.getItem('user');
      let userId = '';
      if (savedUser) { try { userId = JSON.parse(savedUser)._id || ''; } catch (e) {} }
      let headers = new HttpHeaders();
      if (userId) { headers = headers.set('x-user-id', userId); }
      return this.http.post<T>(url, body, { headers });
    }
    return this.http.post<T>(url, body, { headers: this.getHeaders() });
  }

  /**
   * General purpose GET request
   */
  get<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.get<T>(url, { headers: this.getHeaders() });
  }

  /**
   * General purpose PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const isFormData = body instanceof FormData || (body && typeof body.append === 'function' && typeof body.delete === 'function');
    if (isFormData) {
      const savedUser = localStorage.getItem('user');
      let userId = '';
      if (savedUser) { try { userId = JSON.parse(savedUser)._id || ''; } catch (e) {} }
      let headers = new HttpHeaders();
      if (userId) { headers = headers.set('x-user-id', userId); }
      return this.http.put<T>(url, body, { headers });
    }
    return this.http.put<T>(url, body, { headers: this.getHeaders() });
  }

  /**
   * General purpose PATCH request
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const isFormData = body instanceof FormData || (body && typeof body.append === 'function' && typeof body.delete === 'function');
    if (isFormData) {
      const savedUser = localStorage.getItem('user');
      let userId = '';
      if (savedUser) { try { userId = JSON.parse(savedUser)._id || ''; } catch (e) {} }
      let headers = new HttpHeaders();
      if (userId) { headers = headers.set('x-user-id', userId); }
      return this.http.patch<T>(url, body, { headers });
    }
    return this.http.patch<T>(url, body, { headers: this.getHeaders() });
  }

  /**
   * General purpose DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.delete<T>(url, { headers: this.getHeaders() });
  }
}
