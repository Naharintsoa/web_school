/**
 * Page d'administration — Collège Sully
 * Accessible uniquement aux utilisateurs avec les permissions admin:users / admin:roles.
 *
 * Onglets :
 *  1. Utilisateurs  — créer / modifier / supprimer / activer-désactiver
 *  2. Rôles         — créer / modifier les permissions / supprimer
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Check, Eye, EyeOff, Search, KeyRound, AlertTriangle, Save,
  UserCheck, UserX, Crown, Lock,
} from 'lucide-react';
import {
  getUsers, getRoles, createUser, updateUser, deleteUser, toggleUserActive,
  createRole, updateRole, deleteRole,
} from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import type { AppUser, AppRole, Permission } from '../../types/auth';
import { PERMISSION_GROUPS, PERMISSION_LABELS, ALL_PERMISSIONS } from '../../types/auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300',
  gestionnaire: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300',
  professeur: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300',
  secretaire: 'bg-teal-100 text-teal-800 ring-1 ring-teal-300',
  parent: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
};

function RoleBadge({ roleId, roles }: { roleId: string; roles: AppRole[] }) {
  const role = roles.find(r => r.id === roleId);
  const cls = ROLE_COLORS[roleId] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {role?.label ?? roleId}
    </span>
  );
}

// ─── Modal Utilisateur ────────────────────────────────────────────────────────

interface UserModalProps {
  user: AppUser | null; // null = création
  roles: AppRole[];
  onSave: () => void;
  onClose: () => void;
}

function UserModal({ user, roles, onSave, onClose }: UserModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [roleId, setRoleId] = useState(user?.roleId ?? roles[0]?.id ?? '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isEdit && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateUser(user.id, {
          fullName,
          email,
          roleId: user.isSuperAdmin ? user.roleId : roleId,
          isActive: user.isSuperAdmin ? true : isActive,
          newPassword: password || undefined,
        });
      } else {
        await createUser({ username, fullName, email, password, roleId });
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Rôles disponibles (le super_admin ne peut pas être assigné à d'autres)
  const assignableRoles = roles.filter(r => r.id !== 'super_admin');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">
            {isEdit ? `Modifier — ${user.username}` : 'Nouvel utilisateur'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nom complet *</label>
              <input
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Prénom NOM"
              />
            </div>

            {!isEdit && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Identifiant *</label>
                <input
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="ex: j.dupont"
                />
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="email@college-sully.mg"
              />
            </div>

            <div className="col-span-2 relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {isEdit ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
              </label>
              <input
                type={showPwd ? 'text' : 'password'}
                required={!isEdit}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={isEdit ? '••••••••' : 'Min. 8 caractères'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 bottom-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Rôle */}
            <div className={user?.isSuperAdmin ? 'col-span-2 opacity-60' : 'col-span-2'}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rôle *</label>
              {user?.isSuperAdmin ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700">
                  <Crown size={14} /> Super Administrateur (non modifiable)
                </div>
              ) : (
                <select
                  value={roleId}
                  onChange={e => setRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  {assignableRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Actif/Inactif */}
            {!user?.isSuperAdmin && isEdit && (
              <div className="col-span-2 flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-slate-700">Compte actif</span>
                <button
                  type="button"
                  onClick={() => setIsActive(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {isActive ? <><UserCheck size={13} /> Actif</> : <><UserX size={13} /> Inactif</>}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Save size={14} />}
              {isEdit ? 'Enregistrer' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Onglet Utilisateurs ──────────────────────────────────────────────────────

function UsersTab() {
  const { session } = useAuthContext();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<AppUser | null | 'new'>('new' as unknown as null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    const [u, r] = await Promise.all([getUsers(), getRoles()]);
    setUsers(u);
    setRoles(r);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filtered = users.filter(u =>
    `${u.fullName} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteUser(confirmDelete.id);
      setConfirmDelete(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression.');
      setConfirmDelete(null);
    }
  };

  const handleToggle = async (user: AppUser) => {
    try {
      await toggleUserActive(user.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          <span className="flex items-center gap-2"><AlertTriangle size={15} />{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* Barre actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={15} /> Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Dernière connexion</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Aucun utilisateur trouvé.</td>
              </tr>
            ) : filtered.map(u => (
              <tr key={u.id} className={`transition-colors hover:bg-slate-50 ${!u.isActive ? 'opacity-60' : ''}`}>
                {/* Nom + identifiant */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${u.isSuperAdmin ? 'bg-violet-600' : 'bg-indigo-500'}`}>
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {u.fullName}
                        {u.isSuperAdmin && <Crown size={12} className="text-violet-500" />}
                        {u.id === session?.userId && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold">Vous</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{u.username} {u.email ? `· ${u.email}` : ''}</p>
                    </div>
                  </div>
                </td>
                {/* Rôle */}
                <td className="px-4 py-3">
                  <RoleBadge roleId={u.roleId} roles={roles} />
                </td>
                {/* Statut */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                {/* Dernière connexion */}
                <td className="px-4 py-3 text-xs text-slate-400">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Activer/Désactiver */}
                    {!u.isSuperAdmin && (
                      <button
                        onClick={() => handleToggle(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                        title={u.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {u.isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                      </button>
                    )}
                    {/* Modifier */}
                    <button
                      onClick={() => { setEditingUser(u); setShowModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 size={15} />
                    </button>
                    {/* Supprimer */}
                    {!u.isSuperAdmin && u.id !== session?.userId && (
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {(u.isSuperAdmin || u.id === session?.userId) && (
                      <span className="p-1.5 text-slate-200" title="Protégé"><Lock size={15} /></span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <UserModal
          user={editingUser as AppUser | null}
          roles={roles}
          onSave={() => { setShowModal(false); reload(); }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Supprimer ce compte ?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Le compte de <strong>{confirmDelete.fullName}</strong> sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50">Annuler</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Rôles ─────────────────────────────────────────────────────────────

function RolesTab() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [selected, setSelected] = useState<AppRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newName, setNewName] = useState('');
  const [editPerms, setEditPerms] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<AppRole | null>(null);

  const reload = useCallback(async () => {
    const r = await getRoles();
    setRoles(r);
    if (selected) {
      const refreshed = r.find(x => x.id === selected.id);
      if (refreshed) { setSelected(refreshed); setEditPerms([...refreshed.permissions]); }
    }
  }, [selected]);

  useEffect(() => { reload(); }, []); // eslint-disable-line

  const selectRole = (r: AppRole) => {
    setSelected(r);
    setEditPerms([...r.permissions]);
    setIsCreating(false);
    setError('');
  };

  const togglePerm = (p: Permission) => {
    if (selected?.id === 'super_admin') return;
    setEditPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSavePerms = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await updateRole(selected.id, { permissions: editPerms });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!newLabel.trim()) { setError('Le libellé est requis.'); return; }
    try {
      const r = await createRole({ name: newName || newLabel, label: newLabel, permissions: editPerms });
      setIsCreating(false);
      setNewLabel('');
      setNewName('');
      await reload();
      selectRole(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteRole(confirmDelete.id);
      setConfirmDelete(null);
      setSelected(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression.');
      setConfirmDelete(null);
    }
  };

  const isSuperAdmin = selected?.id === 'super_admin';

  return (
    <div className="grid grid-cols-5 gap-4 items-start">
      {/* Liste des rôles */}
      <div className="col-span-2 space-y-2">
        <button
          onClick={() => { setIsCreating(true); setSelected(null); setEditPerms([]); setNewLabel(''); setNewName(''); setError(''); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-sm active:scale-95 transition-all"
        >
          <Plus size={15} /> Nouveau rôle
        </button>

        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => selectRole(r)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
              selected?.id === r.id
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.permissions.length} permission{r.permissions.length > 1 ? 's' : ''}</p>
              </div>
              {r.isSystem && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold">Système</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Panneau droite : matrice de permissions */}
      <div className="col-span-3 bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
        {!selected && !isCreating ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            <div className="text-center">
              <ShieldCheck size={32} className="mx-auto mb-2 text-slate-300" />
              Sélectionnez un rôle pour voir ses permissions
            </div>
          </div>
        ) : (
          <>
            {/* Header panneau */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              {isCreating ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    autoFocus
                    placeholder="Nom du rôle (ex: Comptable)"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <p className="font-bold text-slate-800">{selected?.label}</p>
                  <p className="text-xs text-slate-400">{editPerms.length} / {ALL_PERMISSIONS.length} permissions activées</p>
                </div>
              )}
              <div className="flex items-center gap-2 ml-3">
                {!isCreating && !isSuperAdmin && !selected?.isSystem && (
                  <button
                    onClick={() => setConfirmDelete(selected!)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Supprimer ce rôle"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mx-5 mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                <AlertTriangle size={13} />{error}
              </div>
            )}

            {/* Matrice permissions */}
            <div className="p-5 space-y-5">
              {isSuperAdmin ? (
                <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 text-sm text-violet-700">
                  <Crown size={16} /> Le super administrateur possède toutes les permissions (non modifiable).
                </div>
              ) : (
                PERMISSION_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                    <div className="space-y-1.5">
                      {group.perms.map(perm => {
                        const checked = editPerms.includes(perm);
                        return (
                          <label
                            key={perm}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                              checked ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                            } ${selected?.isSystem && selected?.id !== 'gestionnaire' ? '' : ''}`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                              checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                            }`}>
                              {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => togglePerm(perm)}
                            />
                            <span className={`text-sm ${checked ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>
                              {PERMISSION_LABELS[perm]}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer : sauvegarder */}
            {!isSuperAdmin && (
              <div className="px-5 py-4 border-t border-slate-100">
                {isCreating ? (
                  <div className="flex gap-3">
                    <button onClick={() => setIsCreating(false)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50">Annuler</button>
                    <button onClick={handleCreate} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all">
                      <Plus size={14} /> Créer le rôle
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSavePerms}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                    Enregistrer les permissions
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation suppression rôle */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Supprimer ce rôle ?</h3>
            <p className="text-sm text-slate-500 mb-6">Le rôle <strong>{confirmDelete.label}</strong> sera définitivement supprimé.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50">Annuler</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

type AdminTab = 'users' | 'roles';

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');
  const { hasPermission } = useAuthContext();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-violet-700 via-indigo-700 to-indigo-800 px-6 py-8 mb-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/20">
              <KeyRound size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Administration</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Gestion des accès et des permissions</p>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 bg-white/10 rounded-xl p-1 w-fit">
            {[
              { key: 'users' as AdminTab, label: 'Utilisateurs', icon: Users, perm: 'admin:users' as const },
              { key: 'roles' as AdminTab, label: 'Rôles & Permissions', icon: ShieldCheck, perm: 'admin:roles' as const },
            ].filter(t => hasPermission(t.perm)).map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8">
        {tab === 'users' && hasPermission('admin:users') && <UsersTab />}
        {tab === 'roles' && hasPermission('admin:roles') && <RolesTab />}
      </div>
    </div>
  );
}
