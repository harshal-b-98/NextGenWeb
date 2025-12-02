'use client';

/**
 * Team Management Page
 * Phase 5.1: Admin Dashboard
 *
 * Manage workspace members, roles, and invitations.
 */

import { useEffect, useState, useCallback, use } from 'react';

// Types
interface Member {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Extended with user info if available
  email?: string;
  name?: string;
}

type RoleFilter = 'all' | 'owner' | 'admin' | 'editor' | 'viewer';

export default function TeamManagementPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);

  // Edit form
  const [editRole, setEditRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [updating, setUpdating] = useState(false);

  // Remove state
  const [removing, setRemoving] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const data = await response.json();
      setMembers(data.members);
      setCurrentUserRole(data.currentUserRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('viewer');

      // Show success message
      alert('Invitation sent successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      setUpdating(true);
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${selectedMember.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: editRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setShowEditModal(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    try {
      setRemoving(true);
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${selectedMember.id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setShowRemoveModal(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemoving(false);
    }
  };

  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setEditRole(member.role === 'owner' ? 'admin' : member.role);
    setShowEditModal(true);
  };

  const openRemoveModal = (member: Member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canEditMember = (member: Member) => {
    if (member.role === 'owner') return false;
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && member.role !== 'admin') return true;
    return false;
  };

  const filteredMembers = members.filter(
    (m) => roleFilter === 'all' || m.role === roleFilter
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchMembers}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">
            Manage your workspace members and their permissions
          </p>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter by role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Member</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
              {canManageMembers && (
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.email || member.name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {member.user_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {formatDate(member.joined_at)}
                </td>
                {canManageMembers && (
                  <td className="py-4 px-4 text-right">
                    {canEditMember(member) ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openRemoveModal(member)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No members found with the selected filter
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${getRoleColor('owner')}`}>
              Owner
            </div>
            <p className="text-sm text-gray-600">Full access. Can manage all settings, members, and billing.</p>
          </div>
          <div>
            <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${getRoleColor('admin')}`}>
              Admin
            </div>
            <p className="text-sm text-gray-600">Can manage members (except owner) and all workspace content.</p>
          </div>
          <div>
            <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${getRoleColor('editor')}`}>
              Editor
            </div>
            <p className="text-sm text-gray-600">Can create and edit websites, pages, and content.</p>
          </div>
          <div>
            <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full mb-2 ${getRoleColor('viewer')}`}>
              Viewer
            </div>
            <p className="text-sm text-gray-600">Read-only access to view workspace content and analytics.</p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Team Member</h2>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {currentUserRole === 'owner' && <option value="admin">Admin</option>}
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Role</h2>
            <p className="text-gray-600 mb-4">
              Update role for user {selectedMember.user_id.substring(0, 8)}...
            </p>
            <form onSubmit={handleUpdateRole}>
              <div className="mb-6">
                <label htmlFor="editRole" className="block text-sm font-medium text-gray-700 mb-1">
                  New Role
                </label>
                <select
                  id="editRole"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {currentUserRole === 'owner' && <option value="admin">Admin</option>}
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Remove Member</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this member from the workspace? They will lose access
              to all workspace content.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setSelectedMember(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
