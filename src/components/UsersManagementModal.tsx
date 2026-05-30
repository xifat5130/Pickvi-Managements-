/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { X, Lock, Users, Plus, Trash2, Key, CheckCircle, Shield, Calendar } from 'lucide-react';

interface Props {
  token: string | null;
  currentUser: any;
  onClose: () => void;
}

export default function UsersManagementModal({ token, currentUser, onClose }: Props) {
  // Accounts state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New Provision Form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('moderator');
  const [newPassword, setNewPassword] = useState('');
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState(false);

  // Password Self Update Form
  const [updatePassword, setUpdatePassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetchUsersList();
    }
  }, []);

  const fetchUsersList = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/get_users', {
        headers: { Authorization: token || '' },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);
    setProvisionSuccess(false);

    if (!newUsername || !newFullName || !newPassword) {
      setProvisionError('Fill in all account parameters.');
      return;
    }

    try {
      const response = await fetch('/api/create_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({
          username: newUsername,
          fullName: newFullName,
          role: newRole,
          password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to provision account.');
      }

      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      setProvisionSuccess(true);
      fetchUsersList(); // Reload lists
    } catch (err: any) {
      setProvisionError(err.message || 'Access Denied.');
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete account: ${username}?`)) return;

    try {
      const response = await fetch('/api/delete_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      fetchUsersList();
    } catch (err: any) {
      alert(err.message || 'Deletion denied.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);
    if (!updatePassword || updatePassword.length < 5) {
      setPassError('Password must contain at least 5 character length.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const response = await fetch('/api/change_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token || '',
        },
        body: JSON.stringify({ newPassword: updatePassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setUpdatePassword('');
      setPassSuccess(true);
    } catch (err: any) {
      setPassError(err.message || 'Operation failed.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const isUserAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200/60 grid grid-cols-1 lg:grid-cols-12 overflow-hidden my-6" id="users-management-modal-wrapper">
        {/* Left Hand: Password update & Create user form (Col 5) */}
        <div className="p-6 lg:col-span-5 border-r border-slate-150 space-y-6 bg-slate-50 overflow-y-auto">
          <div className="flex justify-between items-center select-none lg:hidden">
            <h3 className="font-display font-bold text-slate-800">Accounts center</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-full cursor-pointer border border-slate-200 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Update Self Password */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5"><Key className="w-4 h-4 text-slate-400" /> Update your Password</span>
            <form onSubmit={handleUpdatePassword} className="bg-white border border-slate-150 rounded-xl p-4 space-y-3.5">
              <div>
                <span className="text-[10px] text-slate-400 block">Personal Profile</span>
                <strong className="text-xs font-semibold text-slate-700 font-sans block mt-0.5">{currentUser.fullName} ({currentUser.username})</strong>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enter New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="At least 5 characters"
                    value={updatePassword}
                    onChange={(e) => setUpdatePassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </div>
              </div>

              {passError && <p className="text-[11px] text-rose-500">{passError}</p>}
              {passSuccess && <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">✓ Your password successfully updated!</p>}

              <button
                type="submit"
                disabled={isUpdatingPass || !updatePassword.trim()}
                className="w-full py-1.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 select-none transition-all"
              >
                Change password
              </button>
            </form>
          </div>

          {/* Create Users Section (Admin only block) */}
          {isUserAdmin && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-1.5"><Plus className="w-4 h-4 text-emerald-500" /> Provision Team account</span>
              <form onSubmit={handleCreateUser} className="bg-white border border-slate-150 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Username (login ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. moderator_kamal"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Kamal Ahmed"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 cursor-pointer rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="min 5 length"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                {provisionError && <p className="text-[11px] text-rose-500">{provisionError}</p>}
                {provisionSuccess && <p className="text-[11px] text-emerald-600 font-semibold">✓ Sub-account provisioned correctly.</p>}

                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer select-none transition-all mt-1"
                >
                  Create account
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Hand: Browse Users accounts queue (Col 7) */}
        <div className="p-6 lg:col-span-7 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
          <div className="space-y-5">
            <div className="hidden lg:flex justify-between items-center select-none">
              <h3 className="text-base font-display font-extrabold text-slate-800 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-slate-500" /> Administrative team registry
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 bg-slate-50 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer border border-slate-100"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* List users under HPOS permissions checks */}
            {!isUserAdmin ? (
              <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/70 py-12">
                <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-600">Access Denied: Panel Users Locks</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">Your account role (moderator) does not enjoy privileges to list or delete administrative sub-accounts. Only admins can provision keys.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Accounts ({users.length})</span>
                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {isLoadingUsers ? (
                    <div className="py-8 flex justify-center">
                      <svg className="animate-spin h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    users.map((item) => (
                      <div key={item.username} className="p-3.5 flex justify-between items-center text-xs">
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-800 text-xs">{item.fullName}</strong>
                            <span className={`text-[9px] px-1.5 font-bold uppercase rounded border tracking-wide select-none ${
                              item.role === 'admin' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              {item.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: login_auth_{item.username}</div>
                        </div>

                        {item.username !== 'admin' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(item.username)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100/70 text-rose-600 border border-rose-100 rounded-lg cursor-pointer transition-colors"
                            title="Delete Sub-account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">System Primary</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-400 text-center font-mono mt-6 border-t border-slate-250 pt-3">
            Secure bcrypt hashed access.
          </div>
        </div>
      </div>
    </div>
  );
}
