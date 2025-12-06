import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, User } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  users: User[] = [];
  selectedUser: User | null = null;
  searchQuery = '';
  isLoading = false;
  error = '';
  successMessage = '';

  // Edit mode
  isEditing = false;
  editingUser: Partial<User> = {};
  isSaving = false;
  editError = '';

  // Role options
  roleOptions = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Member' }
  ];

  ngOnInit() {
    // Check if user is admin
    this.authService.currentUser$.subscribe(user => {
      if (!user || (user as any).roleId !== 1) {
        this.router.navigate(['/']);
        return;
      }
      this.loadUsers();
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.error = '';
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  searchUsers() {
    if (!this.searchQuery.trim()) {
      this.loadUsers();
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.adminService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to search users';
        this.isLoading = false;
      }
    });
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.isEditing = false;
    this.editError = '';
  }

  startEditing() {
    if (!this.selectedUser) return;
    this.isEditing = true;
    this.editingUser = {
      username: this.selectedUser.username,
      roleId: this.selectedUser.roleId
    };
    this.editError = '';
  }

  cancelEditing() {
    this.isEditing = false;
    this.editingUser = {};
    this.editError = '';
  }

  saveChanges() {
    if (!this.selectedUser) return;

    // Validate
    if (!this.editingUser.username || !this.editingUser.username.trim()) {
      this.editError = 'Username cannot be empty';
      return;
    }

    this.isSaving = true;
    this.editError = '';

    this.adminService.updateUser(this.selectedUser.id, this.editingUser).subscribe({
      next: (updatedUser) => {
        // Update local data
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.selectedUser = updatedUser;
        this.isEditing = false;
        this.editingUser = {};
        this.successMessage = 'User updated successfully!';
        this.isSaving = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.editError = err.error?.error || 'Failed to update user';
        this.isSaving = false;
      }
    });
  }

  getRoleName(roleId: number): string {
    return this.roleOptions.find(r => r.id === roleId)?.name || 'Unknown';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }
}
