'use client';

import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
} from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { useAdmins, useDeleteAdmin, useCreateAdmin, useUpdateAdmin, queryKeys } from "@/lib/query";
import type { AdminUser } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/lib/redux";
import { validatePasswordStrength } from "@/lib/utils/validation";
import { useQueryClient } from "@tanstack/react-query";

const ROLES = ["admin", "super_admin"] as const;
type Role = typeof ROLES[number];

const roleBadge = (role: string) => {
  if (role === "super_admin") return "border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400 text-[10px] font-black font-mono uppercase px-2 py-0.5 tracking-widest";
  return "border-2 border-foreground/40 bg-foreground/5 text-foreground text-[10px] font-black font-mono uppercase px-2 py-0.5 tracking-widest";
};

const generatePassword = () => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const AdminAdmins = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const { data: admins = [], isLoading } = useAdmins();
  const { mutate: createAdmin, isPending: isCreating } = useCreateAdmin();
  const { mutate: updateAdmin, isPending: isUpdating } = useUpdateAdmin();
  const { mutate: deleteAdmin, isPending: isDeleting } = useDeleteAdmin();

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" as Role,
  });
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" as Role,
  });
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const handleCreate = () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error(t("common.fillAllFields")); return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      toast.error(t("auth.passwordMismatch")); return;
    }
    const v = validatePasswordStrength(createForm.password);
    if (!v.isValid) { toast.error(v.errors[0]); return; }
    createAdmin(
      { name: createForm.name, email: createForm.email, password: createForm.password, role: createForm.role },
      {
        onSuccess: () => {
          toast.success(t("admin.adminCreated") || "Admin created");
          queryClient.invalidateQueries({ queryKey: queryKeys.admins });
          setIsCreateOpen(false);
          setCreateForm({ name: "", email: "", password: "", confirmPassword: "", role: "admin" });
        },
        onError: (e: any) => toast.error(e.message || t("common.error")),
      }
    );
  };

  const handleEdit = () => {
    if (!editTarget) return;
    const data: { name?: string; email?: string; role?: "admin" | "super_admin"; password?: string } = {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
    };
    if (editForm.password) {
      if (editForm.password !== editForm.confirmPassword) { toast.error(t("auth.passwordMismatch")); return; }
      const v = validatePasswordStrength(editForm.password);
      if (!v.isValid) { toast.error(v.errors[0]); return; }
      data.password = editForm.password;
    }
    updateAdmin({ id: editTarget.id, data }, {
      onSuccess: () => {
        toast.success(t("admin.adminUpdated") || "Admin updated");
        queryClient.invalidateQueries({ queryKey: queryKeys.admins });
        setIsEditOpen(false);
      },
      onError: (e: any) => toast.error(e.message || t("common.error")),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAdmin(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t("admin.adminDeleted") || "Admin deleted");
        queryClient.invalidateQueries({ queryKey: queryKeys.admins });
        setIsDeleteOpen(false);
      },
      onError: (e: any) => toast.error(e.message || t("common.error")),
    });
  };

  const openEdit = (a: AdminUser) => {
    setEditTarget(a);
    setEditForm({ name: a.name || "", email: a.email, password: "", confirmPassword: "", role: (a.role as Role) || "admin" });
    setIsEditOpen(true);
  };

  const openDelete = (a: AdminUser) => {
    setDeleteTarget(a);
    setIsDeleteOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-6 space-y-6">

        {/* Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-foreground pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-foreground">ADMINISTRATORS</h1>
            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
              {admins.length} {t("admin.totalAdmins") || "admins"}
            </p>
          </div>
          {isSuperAdmin && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider gap-2"
            >
              <FiPlus className="h-4 w-4" />
              NEW ADMIN
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="rounded-none border-2 border-foreground overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center font-mono uppercase tracking-widest text-muted-foreground text-xs">
              {t("common.loading") || "LOADING..."}
            </div>
          ) : admins.length === 0 ? (
            <div className="p-12 text-center font-mono uppercase tracking-widest text-muted-foreground text-xs">
              {t("admin.noAdmins") || "NO ADMINISTRATORS"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground bg-foreground/5">
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">NAME</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">EMAIL</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">ROLE</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">CREATED</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">LAST LOGIN</th>
                    {isSuperAdmin && (
                      <th className="text-right px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">ACTIONS</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, i) => (
                    <tr
                      key={admin.id}
                      className={`border-b border-border hover:bg-foreground/5 transition-colors ${i % 2 === 0 ? "" : "bg-foreground/[0.02]"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 flex-shrink-0 border-2 border-foreground/30 flex items-center justify-center bg-foreground/5">
                            <span className="font-black font-mono text-xs text-foreground">
                              {(admin.name || admin.email)[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold uppercase tracking-wide text-foreground text-xs">{admin.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{admin.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={roleBadge(admin.role)}>
                          {admin.role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {(admin as any).createdAt ? new Date((admin as any).createdAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {(admin as any).lastLogin ? new Date((admin as any).lastLogin).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(admin)}
                              className="rounded-none border border-foreground/30 hover:border-foreground h-7 w-7"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                            </Button>
                            {admin.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDelete(admin)}
                                className="rounded-none border border-red-500/30 hover:border-red-500 text-red-500 h-7 w-7"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* ── CREATE ADMIN DIALOG ── */}
      <Transition show={isCreateOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    NEW ADMINISTRATOR
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">NAME</Label>
                      <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="rounded-none border-2 border-foreground font-mono" placeholder="John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">EMAIL</Label>
                      <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="rounded-none border-2 border-foreground font-mono" placeholder="admin@sayless.kz" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">ROLE</Label>
                      <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as Role })}>
                        <SelectTrigger className="rounded-none border-2 border-foreground font-mono uppercase text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-2 border-foreground">
                          <SelectItem value="admin" className="font-mono uppercase text-xs">ADMIN</SelectItem>
                          <SelectItem value="super_admin" className="font-mono uppercase text-xs">SUPER ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="font-mono uppercase text-xs tracking-widest">PASSWORD</Label>
                        <button
                          type="button"
                          onClick={() => {
                            const pwd = generatePassword();
                            setCreateForm({ ...createForm, password: pwd, confirmPassword: pwd });
                          }}
                          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        >
                          <FiRefreshCw className="h-3 w-3" /> AUTO-GENERATE
                        </button>
                      </div>
                      <div className="relative">
                        <Input type={showCreatePwd ? "text" : "password"} value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowCreatePwd(!showCreatePwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showCreatePwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">CONFIRM PASSWORD</Label>
                      <div className="relative">
                        <Input type={showCreateConfirm ? "text" : "password"} value={createForm.confirmPassword} onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowCreateConfirm(!showCreateConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showCreateConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsCreateOpen(false)}>CANCEL</Button>
                    <Button disabled={isCreating} onClick={handleCreate} className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider">
                      {isCreating ? "CREATING..." : "CREATE"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── EDIT ADMIN DIALOG ── */}
      <Transition show={isEditOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    EDIT ADMIN
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">NAME</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">EMAIL</Label>
                      <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">ROLE</Label>
                      <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as Role })}>
                        <SelectTrigger className="rounded-none border-2 border-foreground font-mono uppercase text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-2 border-foreground">
                          <SelectItem value="admin" className="font-mono uppercase text-xs">ADMIN</SelectItem>
                          <SelectItem value="super_admin" className="font-mono uppercase text-xs">SUPER ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="border-t border-foreground/20 pt-4 space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">LEAVE PASSWORD BLANK TO KEEP UNCHANGED</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">NEW PASSWORD</Label>
                      <div className="relative">
                        <Input type={showEditPwd ? "text" : "password"} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowEditPwd(!showEditPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showEditPwd ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">CONFIRM PASSWORD</Label>
                      <div className="relative">
                        <Input type={showEditConfirm ? "text" : "password"} value={editForm.confirmPassword} onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })} className="rounded-none border-2 border-foreground font-mono pr-10" autoComplete="new-password" />
                        <button type="button" onClick={() => setShowEditConfirm(!showEditConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showEditConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsEditOpen(false)}>CANCEL</Button>
                    <Button disabled={isUpdating} onClick={handleEdit} className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider">
                      {isUpdating ? "SAVING..." : "SAVE"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-none border-2 border-red-500 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black uppercase tracking-widest text-foreground">DELETE ADMIN</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Remove administrator{" "}
              <span className="font-bold text-foreground">{deleteTarget?.name || deleteTarget?.email}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground font-black uppercase tracking-wider">CANCEL</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-none border-2 border-red-500 bg-red-500 text-white hover:bg-background hover:text-red-500 font-black uppercase tracking-wider"
            >
              {isDeleting ? "DELETING..." : "DELETE"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAdmins;
