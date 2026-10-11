import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Plus, GripVertical, Calendar as CalendarIcon, MoreVertical, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().optional(),
  assignedTo: z.string().min(1, 'Assignee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export default function TaskDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: 'MEDIUM' }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, empRes] = await Promise.all([
        api.get('/tasks'),
        ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(user.role) 
          ? api.get('/employees') 
          : Promise.resolve({ data: { data: [] } })
      ]);
      setTasks(tasksRes.data.data);
      if (empRes.data.data) setEmployees(empRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.role]);

  const onSubmit = async (data) => {
    try {
      await api.post('/tasks', data);
      reset();
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/tasks/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-amber-100 text-amber-800';
      case 'LOW': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'border-slate-200 bg-slate-50' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-200 bg-blue-50' },
    { id: 'REVIEW', title: 'Review', color: 'border-amber-200 bg-amber-50' },
    { id: 'DONE', title: 'Done', color: 'border-emerald-200 bg-emerald-50' }
  ];

  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'].includes(user.role);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-500 mt-1">Assign, track, and manage employee deliverables.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-brand-700 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Assign Task
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center flex-1"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="flex-1 flex space-x-6 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className={`flex flex-col flex-shrink-0 w-80 rounded-xl border ${col.color} overflow-hidden shadow-sm`}>
              <div className="px-4 py-3 border-b border-black/5 bg-black/5 font-semibold text-gray-700 flex justify-between items-center">
                {col.title}
                <span className="bg-white px-2 py-0.5 rounded text-xs text-gray-500 shadow-sm font-mono">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative">
                    {isAdmin && (
                      <button onClick={() => handleDelete(task._id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-2 pr-6">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">{task.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary" title={task.assignedTo?.personalDetails?.firstName}>
                          {task.assignedTo?.personalDetails?.firstName?.charAt(0) || '?'}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <select 
                        value={task.status} 
                        onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                        className="text-[10px] border border-gray-200 rounded px-1.5 py-1 focus:ring-0 focus:border-primary text-gray-600 bg-gray-50 hover:bg-gray-100 cursor-pointer font-medium"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Assign New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input {...register('title')} placeholder="e.g. Q4 Financial Audit Report" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select {...register('assignedTo')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white">
                  <option value="">Select an employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.personalDetails.firstName} {emp.personalDetails.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
                {errors.assignedTo && <p className="mt-1 text-xs text-red-500">{errors.assignedTo.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" {...register('dueDate')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                  {errors.dueDate && <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select {...register('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea {...register('description')} rows={3} placeholder="Provide clear requirements..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none" />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}