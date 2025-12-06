import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  roleId: number;
}

export interface UpdateUserRequest {
  username?: string;
  roleId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) {}

  // Get all users (admin only)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/api/admin/users`);
  }

  // Search users by username or email (admin only)
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/api/admin/users/search`, {
      params: { q: query }
    });
  }

  // Get single user by ID (admin only)
  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/api/admin/users/${userId}`);
  }

  // Update user (admin only)
  updateUser(userId: number, data: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/api/admin/users/${userId}`, data);
  }
}
