import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Task {
  _id: string; // MongoDB id
  title: string;
  description?: string;
  date?: string; // yyyy-MM-dd
  time?: string; // HH:mm
  duration?: number; // in minutes
  completed: boolean;
  createdAt: Date;
}

import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    DatePipe,
    SlicePipe,
    FormsModule,
    NavbarComponent,
    HttpClientModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  userName: string = '';
  tasks: Task[] = [];
  showNewTaskModal: boolean = false;
  showEditTaskModal: boolean = false;
  newTask: Partial<Task> = {};
  editTask: Partial<Task> = {};
  editingTaskId: string | null = null;
  
  // Voice command properties
  isListening: boolean = false;
  voiceCommandResult: string = '';
  showVoiceModal: boolean = false;
  
  private apiUrl = 'http://localhost:5000/api';
  private recognition: any;

  constructor(private http: HttpClient, private router: Router) {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      
      this.recognition.onstart = () => {
        this.isListening = true;
        console.log('Voice recognition started');
      };
      
      this.recognition.onresult = (event: any) => {
  const transcript = event.results[0][0].transcript;
  this.voiceCommandResult = `Recognized: "${transcript}"`;
  this.processVoiceCommand(transcript);
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListening = false;
        this.voiceCommandResult = 'Error: Could not recognize speech. Please try again.';
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  ngOnInit(): void {
    this.getUser();
    this.loadTasks();
  }

  // Fetch logged in user's name
  getUser(): void {
    this.http.get<{ userName: string }>(`${this.apiUrl}/tasks/user`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (res) => this.userName = res.userName,
      error: (err) => console.error('Failed to fetch user', err)
    });
  }

  // Fetch tasks from backend
  loadTasks(): void {
    this.http.get<Task[]>(`${this.apiUrl}/tasks`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (res) => {
        this.tasks = res
          .map(task => ({
            ...task,
            createdAt: new Date(task.createdAt)
          }))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort latest first
      },
      error: (err) => console.error('Failed to fetch tasks', err)
    });
  }

  // Voice Command Methods
  startVoiceCommand(): void {
    if (!this.recognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    
    this.showVoiceModal = true;
    this.voiceCommandResult = 'Listening... Speak your command.';
    this.recognition.start();
  }

  processVoiceCommand(transcript: string): void {
    this.voiceCommandResult = `Processing: "${transcript}"...`;
    
    this.http.post<any>(`${this.apiUrl}/tasks/voice-command`, {
      transcript: transcript
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (response) => {
        this.voiceCommandResult = response.message;
        
        // Refresh tasks if a task was created or modified
        if (response.success && (response.task || response.tasks)) {
          this.loadTasks();
        }
        
        // Auto-close modal after 3 seconds on success
        if (response.success) {
          this.closeVoiceModal();
      }
      },
      error: (err) => {
        console.error('Voice command error:', err);
        this.voiceCommandResult = 'Error processing command. Please try again.';
      }
    });
  }

  stopVoiceCommand(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.isListening = false;
  }

  closeVoiceModal(): void {
    this.showVoiceModal = false;
    this.voiceCommandResult = '';
    this.stopVoiceCommand();
  }

  // Add new task
  addTask(): void {
    if (this.newTask.title?.trim()) {
      const taskPayload = {
        title: this.newTask.title.trim(),
        description: this.newTask.description?.trim() || '',
        date: this.newTask.date || '',
        time: this.newTask.time || '',
        duration: this.newTask.duration || 60,
        completed: false
      };

      this.http.post<Task>(`${this.apiUrl}/tasks`, taskPayload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).subscribe({
        next: (res) => {
          this.tasks.push({ ...res, createdAt: new Date(res.createdAt) });
          this.closeNewTaskModal();
        },
        error: (err) => console.error('Failed to create task', err)
      });
    }
  }

  // Toggle completion
  toggleTaskCompletion(task: Task): void {
    this.http.put<Task>(`${this.apiUrl}/tasks/${task._id}`, {
      ...task, completed: !task.completed
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (updated) => {
        task.completed = updated.completed;
      },
      error: (err) => console.error('Failed to update task', err)
    });
  }

  // Delete task
  deleteTask(taskId: string): void {
    this.http.delete(`${this.apiUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(task => task._id !== taskId);
      },
      error: (err) => console.error('Failed to delete task', err)
    });
  }

  // Save edited task
  saveEditTask(): void {
    if (!this.editTask.title?.trim() || this.editingTaskId === null) return;

    const updatedPayload = {
      ...this.editTask,
      title: this.editTask.title?.trim() || '',
      description: this.editTask.description?.trim() || '',
      date: this.editTask.date || '',
      time: this.editTask.time || '',
      duration: this.editTask.duration || 60
    };

    this.http.put<Task>(`${this.apiUrl}/tasks/${this.editingTaskId}`, updatedPayload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: (updated) => {
        this.tasks = this.tasks.map(task =>
          task._id === this.editingTaskId ? { ...updated, createdAt: new Date(updated.createdAt) } : task
        );
        this.closeEditTaskModal();
      },
      error: (err) => console.error('Failed to update task', err)
    });
  }

  // UI helpers
  openNewTaskModal(): void {
    this.showNewTaskModal = true;
    this.newTask = { title: '', description: '', date: '', time: '', duration: 60, completed: false };
  }

  closeNewTaskModal(): void {
    this.showNewTaskModal = false;
    this.newTask = {};
  }

  openEditTaskModal(task: Task): void {
    this.showEditTaskModal = true;
    this.editingTaskId = task._id;
    this.editTask = { ...task };
  }

  closeEditTaskModal(): void {
    this.showEditTaskModal = false;
    this.editTask = {};
    this.editingTaskId = null;
  }

  get upcomingTasks(): Task[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.tasks
      .filter(task => {
        if (task.completed || !task.date) return false;
        const taskDate = new Date(task.date + (task.time ? 'T' + task.time : 'T00:00'));
        return taskDate >= now && taskDate <= nextWeek;
      })
      .sort((a, b) => {
        const aDate = new Date(a.date + (a.time ? 'T' + a.time : 'T00:00'));
        const bDate = new Date(b.date + (b.time ? 'T' + b.time : 'T00:00'));
        return aDate.getTime() - bDate.getTime();
      });
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/');
  }
}