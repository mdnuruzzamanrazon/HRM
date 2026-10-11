const fs = require('fs');
const pages = [
  { name: 'ShiftDashboard', path: 'shift/ShiftDashboard.jsx', title: 'Shift Management' },
  { name: 'ExpenseDashboard', path: 'expense/ExpenseDashboard.jsx', title: 'Expense Management' },
  { name: 'TaxDashboard', path: 'tax/TaxDashboard.jsx', title: 'Tax Management' },
  { name: 'TrackingDashboard', path: 'tracking/TrackingDashboard.jsx', title: 'Employee Tracking' },
  { name: 'NoticeBoard', path: 'noticeboard/NoticeBoard.jsx', title: 'Digital Notice Board' },
  { name: 'TaskDashboard', path: 'task/TaskDashboard.jsx', title: 'Task Management' },
  { name: 'NotificationsDashboard', path: 'notifications/NotificationsDashboard.jsx', title: 'Notifications' },
  { name: 'SecurityDashboard', path: 'security/SecurityDashboard.jsx', title: 'Security Settings' }
];

pages.forEach(p => {
  const dir = `src/pages/${p.path.split('/')[0]}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const content = `import React from 'react';
import { Hammer } from 'lucide-react';

export default function ${p.name}() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
      <div className="bg-brand-100 p-6 rounded-full">
        <Hammer className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900">${p.title}</h2>
      <p className="text-gray-500 max-w-md mx-auto mt-2">This module is currently being scaffolded. The full full-stack implementation with backend database integration is being prepared.</p>
    </div>
  );
}`;
  fs.writeFileSync(`src/pages/${p.path}`, content);
});
console.log('Scaffolding generated');
