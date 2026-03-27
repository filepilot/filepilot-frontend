import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import Header from '../components/Header';
import './AdminPage.css';

const ROLES = ['READER', 'AUTHOR', 'REVIEWER', 'ADMIN'];

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingRole, setUpdatingRole] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        if (tab === 'users') {
          const { data } = await api.get('/admin/users');
          setUsers(data);
        } else {
          const { data } = await api.get('/admin/audit-logs');
          setAuditLogs(data);
        }
      } catch {
        setError('Could not load data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tab]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? data : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeletingUser(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUser(null);
    }
  };

  const ACTION_COLORS = {
    APPROVED: 'approved', REJECTED: 'rejected',
    CREATED: 'pending_review', DELETED: 'rejected',
    REGISTERED: 'approved', SUBMITTED: 'pending_review',
    ROLE_CHANGED: 'pending_review', ADDED: 'pending_review',
    UPDATED: 'pending_review',
  };

  const getActionClass = (action) => {
    const key = Object.keys(ACTION_COLORS).find(k => action.includes(k));
    return key ? ACTION_COLORS[key] : 'draft';
  };

  return (
    <div className="page-layout">
      <Header />
      <main className="page-content">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Panel</h1>
            <p className="admin-subtitle">Manage users and view system audit logs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users {users.length > 0 && <span className="admin-tab-count">{users.length}</span>}
          </button>
          <button
            className={`admin-tab ${tab === 'audit' ? 'admin-tab--active' : ''}`}
            onClick={() => setTab('audit')}
          >
            Audit Logs {auditLogs.length > 0 && <span className="admin-tab-count">{auditLogs.length}</span>}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        {/* Users table */}
        {!loading && tab === 'users' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={u.id === user?.id ? 'admin-table-row--self' : ''}>
                    <td className="admin-table-id">#{u.id}</td>
                    <td className="admin-table-username">
                      <div className="admin-table-username__inner">
                        {u.username}
                        {u.id === user?.id && <span className="admin-self-tag">you</span>}
                      </div>
                    </td>
                    <td className="admin-table-email">{u.email}</td>
                    <td>
                      <select
                        className="admin-role-select"
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        disabled={updatingRole === u.id || u.id === user?.id}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="admin-table-date">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {u.id !== user?.id && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={deletingUser === u.id}
                        >
                          {deletingUser === u.id ? '...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state"><p>No users found.</p></div>
            )}
          </div>
        )}

        {/* Audit logs */}
        {!loading && tab === 'audit' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="admin-table-date">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="admin-table-username">
                      <div className="admin-table-username__inner">
                        {log.username || '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getActionClass(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="admin-table-entity">
                      {log.entityType} #{log.entityId}
                    </td>
                    <td className="admin-table-details">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 && (
              <div className="empty-state"><p>No audit logs yet.</p></div>
            )}
          </div>
        )}
      </main>
      
    </div>
  );
}
