import React from 'react';
import { Hammer } from 'lucide-react';

export default function NotificationsDashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
      <div className="bg-brand-100 p-6 rounded-full">
        <Hammer className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
      <p className="text-gray-500 max-w-md mx-auto mt-2">This module is currently being scaffolded. The full full-stack implementation with backend database integration is being prepared.</p>
    </div>
  );
}