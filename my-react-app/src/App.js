import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaTrash, FaEdit, FaCheck, FaSun, FaMoon } from 'react-icons/fa';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const interval = setInterval(checkDeadlines, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token, tasks]);

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks with token:', token);
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Tasks fetched:', res.data);
      setTasks(res.data);
      if (res.data.length === 0) {
        toast.info('Aucune tâche trouvée pour cet utilisateur.');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Échec de la récupération des tâches');
      toast.error(err.response?.data?.message || 'Échec de la récupération des tâches');
    }
  };

  const register = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/register', { email, password });
      toast.success('Utilisateur enregistré ! Veuillez vous connecter.');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l’inscription');
      toast.error(err.response?.data?.message || 'Échec de l’inscription');
    }
  };

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setEmail('');
      setPassword('');
      toast.success('Connexion réussie !');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la connexion');
      toast.error(err.response?.data?.message || 'Échec de la connexion');
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setTasks([]);
    toast.info('Déconnexion réussie');
  };

  const addTask = async () => {
    if (!title.trim()) {
      setError('Le titre de la tâche est requis');
      toast.error('Le titre de la tâche est requis');
      return;
    }
    try {
      const res = await axios.post(
          'http://localhost:5000/api/tasks',
          { title, description, dueDate, tags, priority },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks([...tasks, res.data]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setTags([]);
      setPriority('medium');
      toast.success('Tâche ajoutée avec succès !');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l’ajout de la tâche');
      toast.error(err.response?.data?.message || 'Échec de l’ajout de la tâche');
    }
  };

  const deleteTask = async (id) => {
    const confirmDelete = window.confirm('Voulez-vous vraiment supprimer cette tâche ?');
    if (!confirmDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((task) => task._id !== id));
      toast.success('Tâche supprimée avec succès !');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la suppression de la tâche');
      toast.error(err.response?.data?.message || 'Échec de la suppression de la tâche');
    }
  };

  const startEditing = (task) => setEditingTask({ ...task });

  const saveEdit = async () => {
    if (!editingTask.title.trim()) {
      setError('Le titre de la tâche est requis');
      toast.error('Le titre de la tâche est requis');
      return;
    }
    try {
      const res = await axios.put(
          `http://localhost:5000/api/tasks/${editingTask._id}`,
          editingTask,
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((task) => (task._id === res.data._id ? res.data : task)));
      setEditingTask(null);
      toast.success('Tâche mise à jour avec succès !');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la mise à jour de la tâche');
      toast.error(err.response?.data?.message || 'Échec de la mise à jour de la tâche');
    }
  };

  const toggleStatus = async (task) => {
    const updatedTask = { ...task, status: task.status === 'pending' ? 'completed' : 'pending' };
    try {
      const res = await axios.put(
          `http://localhost:5000/api/tasks/${task._id}`,
          updatedTask,
          { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map((t) => (t._id === res.data._id ? res.data : t)));
      toast.success(`Tâche marquée comme ${res.data.status} !`);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec du changement de statut');
      toast.error(err.response?.data?.message || 'Échec du changement de statut');
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedTasks = [...tasks];
    const [movedTask] = reorderedTasks.splice(result.source.index, 1);
    reorderedTasks.splice(result.destination.index, 0, movedTask);
    setTasks(reorderedTasks);
    toast.info('Tâches réorganisées !');
  };

  const checkDeadlines = () => {
    const now = new Date();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        const timeDiff = due - now;
        if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 && task.status !== 'completed') {
          toast.warn(`La tâche "${task.title}" est due bientôt !`);
        }
      }
    });
  };

  const filteredTasks = tasks
      .filter((task) => filter === 'all' || task.status === filter)
      .filter(
          (task) =>
              task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) =>
          sortBy === 'dueDate'
              ? new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')
              : new Date(a.createdAt) - new Date(b.createdAt)
      );

  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!token) {
    return (
        <div className={`App ${darkMode ? 'dark' : ''}`}>
          <h1>Task Flow</h1>
          {error && <p className="error">{error}</p>}
          <div className="auth-form">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button onClick={login}>Login</button>
            <button onClick={register}>Register</button>
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
  }

  return (
      <div className={`App ${darkMode ? 'dark' : ''}`}>
        <div className="header">
          <h1>Task Flow</h1>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button onClick={logout}>Logout</button>
        </div>

        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        <p className="progress-text">{Math.round(progress)}% Complete</p>
        {error && <p className="error">{error}</p>}

        <div className="add-task">
          <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a creative task..."
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
          />
          <input
              type="text"
              value={tags.join(',')}
              onChange={(e) => setTags(e.target.value.split(',').map((tag) => tag.trim()))}
              placeholder="Tags (e.g., urgent, work)"
          />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={addTask}>Create</button>
        </div>

        <div className="search-bar">
          <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
          />
        </div>

        <div className="controls">
          <label>Filter: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <label>Sort by: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Created Date</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef}>
                  {filteredTasks.length > 0 ? (
                      filteredTasks.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided) => (
                                <li
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`task-card ${task.status} priority-${task.priority}`}
                                >
                                  {editingTask && editingTask._id === task._id ? (
                                      <>
                                        <input
                                            type="text"
                                            value={editingTask.title}
                                            onChange={(e) =>
                                                setEditingTask({ ...editingTask, title: e.target.value })
                                            }
                                        />
                                        <input
                                            type="text"
                                            value={editingTask.description}
                                            onChange={(e) =>
                                                setEditingTask({ ...editingTask, description: e.target.value })
                                            }
                                        />
                                        <input
                                            type="text"
                                            value={editingTask.tags?.join(',') || ''}
                                            onChange={(e) =>
                                                setEditingTask({
                                                  ...editingTask,
                                                  tags: e.target.value.split(',').map((tag) => tag.trim()),
                                                })
                                            }
                                            placeholder="Tags (e.g., urgent, work)"
                                        />
                                        <input
                                            type="date"
                                            value={
                                              editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''
                                            }
                                            onChange={(e) =>
                                                setEditingTask({ ...editingTask, dueDate: e.target.value })
                                            }
                                        />
                                        <select
                                            value={editingTask.priority}
                                            onChange={(e) =>
                                                setEditingTask({ ...editingTask, priority: e.target.value })
                                            }
                                        >
                                          <option value="low">Low</option>
                                          <option value="medium">Medium</option>
                                          <option value="high">High</option>
                                        </select>
                                        <button onClick={saveEdit}>Save</button>
                                        <button onClick={() => setEditingTask(null)}>Cancel</button>
                                      </>
                                  ) : (
                                      <>
                                        <div className="task-content">
                                          <strong>{task.title}</strong>
                                          {task.description && <p>{task.description}</p>}
                                          {task.tags && task.tags.length > 0 && (
                                              <div className="tags">
                                                {task.tags.map((tag, index) => (
                                                    <span key={index} className="tag">
                                      {tag}
                                    </span>
                                                ))}
                                              </div>
                                          )}
                                          {task.dueDate && !isNaN(new Date(task.dueDate).getTime()) && (
                                              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                          )}
                                          <span className="priority-label">{task.priority}</span>
                                        </div>
                                        <div className="task-actions">
                                          <FaCheck onClick={() => toggleStatus(task)} />
                                          <FaEdit onClick={() => startEditing(task)} />
                                          <FaTrash onClick={() => deleteTask(task._id)} />
                                        </div>
                                      </>
                                  )}
                                </li>
                            )}
                          </Draggable>
                      ))
                  ) : (
                      <li className="no-tasks">Aucune tâche à afficher</li>
                  )}
                  {provided.placeholder}
                </ul>
            )}
          </Droppable>
        </DragDropContext>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
  );
}

export default App;