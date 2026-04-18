'use client';

import { useState, useCallback, Fragment } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { AdminHeader } from "@/components/AdminHeader";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useUpdateCompanyStatus,
  useUpdateCompanyPlan,
  useDeleteCompany,
  usePlans,
} from "@/lib/query";
import { getTranslatedValue } from "@/lib/utils/translations";
import { toast } from "sonner";
import type { Company, CompanyStatus, PlanType } from "@/types";
import { validatePasswordStrength } from "@/lib/utils/validation";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiToggleLeft,
  FiPackage,
} from "react-icons/fi";

const ITEMS_PER_PAGE = 10;

const statusLabel = (status: CompanyStatus) => {
  if (status === "Active") return "ACTIVE";
  if (status === "Trial") return "TRIAL";
  return "BLOCKED";
};

const StatusBadge = ({ status }: { status: CompanyStatus }) => {
  const map: Record<string, string> = {
    "Active": "border-2 border-green-500 bg-green-500/10 text-green-400",
    "Trial": "border-2 border-yellow-400 bg-yellow-400/10 text-yellow-300",
    "Blocked": "border-2 border-red-500 bg-red-500/10 text-red-400",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-black tracking-widest uppercase font-mono rounded-none ${map[status] ?? "border-2 border-border text-muted-foreground"}`}
    >
      {statusLabel(status)}
    </span>
  );
};

const AdminCompanies = () => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Create form
  const [newCompany, setNewCompany] = useState({
    name: "",
    adminEmail: "",
    code: "",
    password: "",
    plan: "Trial" as PlanType,
    messagesLimit: 10,
    storageLimit: 1,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", adminEmail: "", code: "" });

  // Status modal
  const [selectedStatus, setSelectedStatus] = useState<CompanyStatus>("Active");

  // Plan modal
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("Trial");

  const { data: companies = [], isLoading } = useCompanies();
  const { data: plans = [] } = usePlans();
  const { mutate: createCompany, isPending: isCreating } = useCreateCompany();
  const { mutate: updateCompany, isPending: isUpdating } = useUpdateCompany();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateCompanyStatus();
  const { mutate: updatePlan, isPending: isUpdatingPlan } = useUpdateCompanyPlan();
  const { mutate: deleteCompany, isPending: isDeleting } = useDeleteCompany();

  const filtered = companies.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.status === "Active") ||
      (statusFilter === "trial" && c.status === "Trial") ||
      (statusFilter === "blocked" && c.status === "Blocked");
    const matchPlan =
      planFilter === "all" ||
      c.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCreate = () => {
    if (!newCompany.name || !newCompany.adminEmail || !newCompany.code || !newCompany.password) {
      toast.error(t("common.fillAllFields"));
      return;
    }
    if (newCompany.password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    const v = validatePasswordStrength(newCompany.password);
    if (!v.isValid) { toast.error(v.errors[0]); return; }
    createCompany(
      { ...newCompany, status: newCompany.plan === "Trial" ? "Trial" : "Active" as CompanyStatus },
      {
        onSuccess: () => {
          toast.success(t("admin.companyCreated") || "Company created");
          setIsCreateOpen(false);
          setNewCompany({ name: "", adminEmail: "", code: "", password: "", plan: "Trial", messagesLimit: 10, storageLimit: 1 });
          setConfirmPassword("");
        },
        onError: (e: any) => toast.error(e.message || t("common.error")),
      }
    );
  };

  const handleEdit = () => {
    if (!selectedCompany) return;
    updateCompany(
      { id: selectedCompany.id, updates: editForm },
      {
        onSuccess: () => { toast.success(t("admin.companyUpdated") || "Updated"); setIsEditOpen(false); },
        onError: (e: any) => toast.error(e.message || t("common.error")),
      }
    );
  };

  const handleStatusChange = () => {
    if (!selectedCompany) return;
    updateStatus(
      { id: selectedCompany.id, status: selectedStatus },
      {
        onSuccess: () => { toast.success(t("admin.statusUpdated") || "Status updated"); setIsStatusOpen(false); },
        onError: (e: any) => toast.error(e.message || t("common.error")),
      }
    );
  };

  const handlePlanChange = () => {
    if (!selectedCompany) return;
    updatePlan(
      { id: selectedCompany.id, plan: selectedPlan },
      {
        onSuccess: () => { toast.success(t("admin.planUpdated") || "Plan updated"); setIsPlanOpen(false); },
        onError: (e: any) => toast.error(e.message || t("common.error")),
      }
    );
  };

  const handleDelete = () => {
    if (!selectedCompany) return;
    deleteCompany({ id: selectedCompany.id }, {
      onSuccess: () => { toast.success(t("admin.companyDeleted") || "Deleted"); setIsDeleteOpen(false); setSelectedCompany(null); },
      onError: (e: any) => toast.error(e.message || t("common.error")),
    });
  };

  const openEdit = useCallback((c: Company) => {
    setSelectedCompany(c);
    setEditForm({ name: c.name, adminEmail: c.adminEmail, code: c.code });
    setIsEditOpen(true);
  }, []);

  const openStatus = useCallback((c: Company) => {
    setSelectedCompany(c);
    setSelectedStatus(c.status);
    setIsStatusOpen(true);
  }, []);

  const openPlan = useCallback((c: Company) => {
    setSelectedCompany(c);
    setSelectedPlan(c.plan);
    setIsPlanOpen(true);
  }, []);

  const openDelete = useCallback((c: Company) => {
    setSelectedCompany(c);
    setIsDeleteOpen(true);
  }, []);

  const uniquePlans = Array.from(new Set(companies.map((c) => c.plan)));

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-6 space-y-6">

        {/* Title bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-foreground pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-foreground">
              COMPANIES
            </h1>
            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
              {filtered.length} {t("admin.total") || "total"}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider gap-2"
          >
            <FiPlus className="h-4 w-4" />
            {t("admin.createCompany") || "NEW COMPANY"}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search") || "SEARCH..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 rounded-none border-2 border-foreground font-mono uppercase placeholder:uppercase placeholder:text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-44 rounded-none border-2 border-foreground font-mono uppercase text-xs">
              <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-2 border-foreground">
              <SelectItem value="all" className="font-mono uppercase text-xs">ALL STATUS</SelectItem>
              <SelectItem value="active" className="font-mono uppercase text-xs">ACTIVE</SelectItem>
              <SelectItem value="trial" className="font-mono uppercase text-xs">TRIAL</SelectItem>
              <SelectItem value="blocked" className="font-mono uppercase text-xs">BLOCKED</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-44 rounded-none border-2 border-foreground font-mono uppercase text-xs">
              <SelectValue placeholder="PLAN" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-2 border-foreground">
              <SelectItem value="all" className="font-mono uppercase text-xs">ALL PLANS</SelectItem>
              {uniquePlans.map((p) => (
                <SelectItem key={p} value={p} className="font-mono uppercase text-xs">{p.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="rounded-none border-2 border-foreground overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center font-mono uppercase tracking-widest text-muted-foreground text-xs">
              {t("common.loading") || "LOADING..."}
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center font-mono uppercase tracking-widest text-muted-foreground text-xs">
              {t("common.noData") || "NO COMPANIES FOUND"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground bg-foreground/5">
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">NAME</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">CODE</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">STATUS</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">PLAN</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">MESSAGES</th>
                    <th className="text-left px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">REGISTERED</th>
                    <th className="text-right px-4 py-3 font-black uppercase tracking-widest text-xs text-foreground">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border hover:bg-foreground/5 transition-colors ${i % 2 === 0 ? "" : "bg-foreground/[0.02]"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold uppercase tracking-wide text-foreground text-xs">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{c.adminEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-foreground/10 border border-foreground/30 px-1.5 py-0.5 uppercase tracking-widest">
                            {c.code}
                          </span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <FiCopy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs uppercase tracking-wider text-foreground">{c.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-foreground">{c.messages}</span>
                        {c.messagesLimit ? (
                          <span className="font-mono text-[10px] text-muted-foreground"> / {c.messagesLimit}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.registered ? new Date(c.registered).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-none border border-foreground/30 hover:border-foreground h-7 w-7">
                              <FiMoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none border-2 border-foreground min-w-[160px]">
                            <DropdownMenuItem
                              className="font-mono uppercase text-xs tracking-wider gap-2 cursor-pointer"
                              onClick={() => openEdit(c)}
                            >
                              <FiEdit className="h-3.5 w-3.5" /> EDIT
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="font-mono uppercase text-xs tracking-wider gap-2 cursor-pointer"
                              onClick={() => openStatus(c)}
                            >
                              <FiToggleLeft className="h-3.5 w-3.5" /> CHANGE STATUS
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="font-mono uppercase text-xs tracking-wider gap-2 cursor-pointer"
                              onClick={() => openPlan(c)}
                            >
                              <FiPackage className="h-3.5 w-3.5" /> CHANGE PLAN
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-foreground/20" />
                            <DropdownMenuItem
                              className="font-mono uppercase text-xs tracking-wider gap-2 cursor-pointer text-red-500 focus:text-red-500"
                              onClick={() => openDelete(c)}
                            >
                              <FiTrash2 className="h-3.5 w-3.5" /> DELETE
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              PAGE {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-none border-2 border-foreground h-8 w-8"
              >
                <FiChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-none border-2 border-foreground h-8 w-8"
              >
                <FiChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── CREATE COMPANY DIALOG ── */}
      <Transition show={isCreateOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    NEW COMPANY
                  </Dialog.Title>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">COMPANY NAME</Label>
                      <Input value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} className="rounded-none border-2 border-foreground font-mono" placeholder="Acme Corp" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">CODE</Label>
                      <Input value={newCompany.code} onChange={(e) => setNewCompany({ ...newCompany, code: e.target.value.toUpperCase() })} className="rounded-none border-2 border-foreground font-mono uppercase" placeholder="ACME" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">PLAN</Label>
                      <Select value={newCompany.plan} onValueChange={(v) => setNewCompany({ ...newCompany, plan: v as PlanType })}>
                        <SelectTrigger className="rounded-none border-2 border-foreground font-mono uppercase text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-2 border-foreground">
                          {plans.map((p) => (
                            <SelectItem key={p.id} value={typeof p.name === "string" ? p.name : getTranslatedValue(p.name)} className="font-mono uppercase text-xs">
                              {typeof p.name === "string" ? p.name.toUpperCase() : getTranslatedValue(p.name).toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">ADMIN EMAIL</Label>
                      <Input type="email" value={newCompany.adminEmail} onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })} className="rounded-none border-2 border-foreground font-mono" placeholder="admin@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">PASSWORD</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={newCompany.password} onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })} className="rounded-none border-2 border-foreground font-mono pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">CONFIRM</Label>
                      <div className="relative">
                        <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-none border-2 border-foreground font-mono pr-10" />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">MSG LIMIT</Label>
                      <Input type="number" min={1} value={newCompany.messagesLimit} onChange={(e) => setNewCompany({ ...newCompany, messagesLimit: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">STORAGE (GB)</Label>
                      <Input type="number" min={1} value={newCompany.storageLimit} onChange={(e) => setNewCompany({ ...newCompany, storageLimit: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsCreateOpen(false)}>
                      CANCEL
                    </Button>
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

      {/* ── EDIT DIALOG ── */}
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
                    EDIT COMPANY
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">NAME</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">CODE</Label>
                      <Input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} className="rounded-none border-2 border-foreground font-mono uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">ADMIN EMAIL</Label>
                      <Input type="email" value={editForm.adminEmail} onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })} className="rounded-none border-2 border-foreground font-mono" />
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

      {/* ── STATUS DIALOG ── */}
      <Transition show={isStatusOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsStatusOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    CHANGE STATUS
                  </Dialog.Title>
                  <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{selectedCompany?.name}</p>
                  <div className="space-y-2">
                    {(["Active", "Trial", "Blocked"] as CompanyStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 border-2 font-mono uppercase text-xs tracking-widest transition-colors ${selectedStatus === s ? "border-foreground bg-foreground text-background" : "border-foreground/30 hover:border-foreground text-foreground"}`}
                      >
                        <StatusBadge status={s} />
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsStatusOpen(false)}>CANCEL</Button>
                    <Button disabled={isUpdatingStatus} onClick={handleStatusChange} className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider">
                      {isUpdatingStatus ? "SAVING..." : "APPLY"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── PLAN DIALOG ── */}
      <Transition show={isPlanOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsPlanOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    CHANGE PLAN
                  </Dialog.Title>
                  <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{selectedCompany?.name}</p>
                  <div className="space-y-2">
                    {plans.map((p) => {
                      const pName = typeof p.name === "string" ? p.name : getTranslatedValue(p.name);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPlan(pName as PlanType)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 border-2 font-mono uppercase text-xs tracking-widest transition-colors ${selectedPlan === pName ? "border-foreground bg-foreground text-background" : "border-foreground/30 hover:border-foreground text-foreground"}`}
                        >
                          <span>{pName.toUpperCase()}</span>
                          <span className="font-black">{p.price} ₸/mo</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsPlanOpen(false)}>CANCEL</Button>
                    <Button disabled={isUpdatingPlan} onClick={handlePlanChange} className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider">
                      {isUpdatingPlan ? "SAVING..." : "APPLY"}
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
            <AlertDialogTitle className="font-black uppercase tracking-widest text-foreground">
              DELETE COMPANY
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              This action cannot be undone. Company{" "}
              <span className="font-bold text-foreground">{selectedCompany?.name}</span> and all associated data will be permanently deleted.
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

export default AdminCompanies;
