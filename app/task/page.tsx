'use client'
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/ui/Navbar';
import axios from 'axios';

interface TaskItem {
  id: string;
  title: string;
  link: string;
  point: number;
  createdAt: string;
}

interface User {
  id: string;
  telegramId: string;
  score: number;
}

export default function Task() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>(''); // Replace this with real user ID from auth/session

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get('/api/tasks');
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleVerify = async (taskId: string, point: number) => {
    try {
      // Update user score via API
      await axios.put(`/api/user/${userId}/score`, { point });

      alert('✅ Points added successfully!');
    } catch (err) {
      console.error('Verification failed:', err);
      alert('⚠️ Failed to verify task.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#06060F] to-[#1a1c2f] p-4 md:p-8 pb-20">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0e1024] rounded-lg p-4 mb-4">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-800 rounded w-3/4 mb-4"></div>
              <div className="h-2 bg-gray-800 rounded w-full mb-2"></div>
              <div className="h-2 bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#06060F] to-[#1a1c2f] p-4 md:p-8 pb-20">
      <div className="max-w-4xl mx-auto h-[calc(100vh-5rem)] overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-6 sticky top-0 bg-[#06060F] z-10 py-4">
          Daily Tasks ({tasks.length})
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-[#0e1024] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                  <span className="text-2xl">🎁</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">{task.title}</h3>
                  <span className="text-sm text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-4">{task.title}</p>

              <div className="my-4 bg-gradient-to-r from-[#2e3248] to-[#3a3f5a] p-2 rounded-full flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🪙</span>
                  <span className="font-bold text-yellow-400">{task.point} Points</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 text-center text-sm"
                >
                  Perform Task
                </a>
                <button
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors text-sm"
                  onClick={() => handleVerify(task.id, task.point)}
                >
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Navbar />
    </div>
  );
}
