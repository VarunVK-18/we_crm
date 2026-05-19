import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly baseUrl = 'http://localhost:5001/api';

  constructor(private http: HttpClient) {}

  /**
   * Helper to construct auth headers
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
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

  /**
   * Register a new user in the system
   * @param userData Registration data (email, password, owner_name, role, etc.)
   */
  register(userData: any): Observable<any> {
    const url = `${this.baseUrl}/register`;
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
    return this.http.put<T>(url, body, { headers: this.getHeaders() });
  }

  /**
   * General purpose DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.delete<T>(url, { headers: this.getHeaders() });
  }
}
