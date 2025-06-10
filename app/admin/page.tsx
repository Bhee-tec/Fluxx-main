"use client";
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

interface User {
  id: string; // Changed to string for MongoDB ObjectId
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  points: number;
  score: number;
  moves: number;
}

interface Task {
  id: string; // String for MongoDB ObjectId
  title: string;
  link: string;
  point: number;
}

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState<boolean>(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [totalScores, setTotalScores] = useState<number>(0);
  const [newTask, setNewTask] = useState({ title: "", link: "", point: 0 });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    // Fetch users from API
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/user", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        const users: User[] = await response.json();
        setUsers(users);
        setTotalUsers(users.length);
        setTotalPoints(users.reduce((acc, user) => acc + user.points, 0));
        setTotalScores(users.reduce((acc, user) => acc + user.score, 0));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    // Fetch tasks from API
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }
        const tasks: Task[] = await response.json();
        setTasks(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchUsers();
    fetchTasks();
  }, []);

  const handleAddOrUpdateTask = async () => {
    try {
      if (editingTaskId !== null) {
        // Update existing task
        const response = await fetch(`/api/tasks/${editingTaskId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });
        if (!response.ok) {
          throw new Error(`Failed to update task: ${response.status}`);
        }
        const updatedTask: Task = await response.json();
        setTasks(tasks.map((task) => (task.id === editingTaskId ? updatedTask : task)));
        setEditingTaskId(null);
      } else {
        // Create new task
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTask),
        });
        if (!response.ok) {
          throw new Error(`Failed to create task: ${response.status}`);
        }
        const createdTask: Task = await response.json();
        setTasks([...tasks, createdTask]);
      }
      setNewTask({ title: "", link: "", point: 0 });
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleEditTask = (task: Task) => {
    setNewTask({ title: task.title, link: task.link, point: task.point });
    setEditingTaskId(task.id);
    setShowTasks(false);
    setSidebarOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-pixel bg-[#1a1a2e] text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-[#0f3460] shadow-md">
        <h1 className="text-2xl font-bold">🎮 Game Dashboard</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 w-64 bg-[#0f3460] p-6 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <h1 className="text-3xl font-extrabold mb-6 text-yellow-400">⚔️ Fluxx Admin</h1>
        <nav className="space-y-4">
          <button
            className="w-full text-left px-4 py-2 bg-[#16213e] hover:bg-yellow-500 rounded"
            onClick={() => {
              setShowTasks(false);
              setSidebarOpen(false);
            }}
          >
            🏰 Dashboard
          </button>
          <button
            className="w-full text-left px-4 py-2 bg-[#16213e] hover:bg-yellow-500 rounded"
            onClick={() => {
              setShowTasks(true);
              setSidebarOpen(false);
            }}
          >
            🎯 Tasks
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#1a1a2e] text-white">
        {!showTasks ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#16213e] rounded-lg shadow-lg p-6 border border-yellow-400">
                <h2 className="text-lg font-semibold mb-2">Total Players</h2>
                <p className="text-3xl font-extrabold text-yellow-300">{totalUsers}</p>
              </div>

              <div className="bg-[#16213e] rounded-lg shadow-lg p-6 border border-yellow-400">
                <h2 className="text-lg font-semibold mb-2">Total Points</h2>
                <p className="text-3xl font-extrabold text-blue-300">{totalPoints}</p>
              </div>

              <div className="bg-[#16213e] rounded-lg shadow-lg p-6 border border-yellow-400">
                <h2 className="text-lg font-semibold mb-2">Total Score</h2>
                <p className="text-3xl font-extrabold text-green-300">{totalScores}</p>
              </div>
            </div>

            <div className="bg-[#0f3460] p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTaskId ? "🛠️ Edit Task" : "➕ Add New Task"}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full p-2 rounded bg-[#1a1a2e] text-white border border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Task Link"
                  value={newTask.link}
                  onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                  className="w-full p-2 rounded bg-[#1a1a2e] text-white border border-gray-600"
                />
                <input
                  type="number"
                  placeholder="Points"
                  value={newTask.point}
                  onChange={(e) => setNewTask({ ...newTask, point: Number(e.target.value) })}
                  className="w-full p-2 rounded bg-[#1a1a2e] text-white border border-gray-600"
                />
                <button
                  onClick={handleAddOrUpdateTask}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded"
                >
                  {editingTaskId ? "Update Task" : "Submit Task"}
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#0f3460] rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">🏆 Player Stats</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-[#16213e]">
                    <tr>
                      <th className="text-left px-4 py-2">Player</th>
                      <th className="text-left px-4 py-2">Points</th>
                      <th className="text-left px-4 py-2">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-2">
                          {user.firstName || user.username || "Unknown"}
                        </td>
                        <td className="px-4 py-2 text-yellow-300">{user.points}</td>
                        <td className="px-4 py-2 text-green-300">{user.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[#0f3460] rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">🗺️ Active Quests</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-[#16213e]">
                  <tr>
                    <th className="text-left px-4 py-2">Quest</th>
                    <th className="text-left px-4 py-2">Link</th>
                    <th className="text-left px-4 py-2">Reward</th>
                    <th className="text-left px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-2">{task.title}</td>
                      <td className="px-4 py-2 text-blue-400 underline">
                        <a href={task.link} target="_blank" rel="noopener noreferrer">
                          {task.link}
                        </a>
                      </td>
                      <td className="px-4 py-2">Score {task.point}</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded mr-2"
                          onClick={() => handleEditTask(task)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;