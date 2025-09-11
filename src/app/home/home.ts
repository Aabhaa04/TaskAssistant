import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-home',
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  userName: string = 'Aman Singh';
  tasks: Task[] = [];
  showNewTaskModal: boolean = false;
  newTask: Partial<Task> = {};

  constructor() {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    // Load tasks from localStorage or initialize empty array
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt)
      }));
    }
  }

  saveTasks(): void {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  get upcomingTasks(): Task[] {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return this.tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate >= now && 
      task.dueDate <= nextWeek
    ).sort((a, b) => 
      (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0)
    );
  }

  openNewTaskModal(): void {
    this.showNewTaskModal = true;
    this.newTask = {
      title: '',
      description: '',
      dueDate: undefined,
      completed: false
    };
  }

  closeNewTaskModal(): void {
    this.showNewTaskModal = false;
    this.newTask = {};
  }

  addTask(): void {
    if (this.newTask.title?.trim()) {
      const task: Task = {
        id: Date.now(),
        title: this.newTask.title.trim(),
        description: this.newTask.description?.trim() || '',
        dueDate: this.newTask.dueDate,
        completed: false,
        createdAt: new Date()
      };
      
      this.tasks.push(task);
      this.saveTasks();
      this.closeNewTaskModal();
    }
  }

  toggleTaskCompletion(task: Task): void {
    task.completed = !task.completed;
    this.saveTasks();
  }

  deleteTask(taskId: number): void {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.saveTasks();
  }

  startVoiceCommand(): void {
    // Placeholder for voice command functionality
    console.log('Voice command started');
    // In a real implementation, you would integrate with Web Speech API
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}