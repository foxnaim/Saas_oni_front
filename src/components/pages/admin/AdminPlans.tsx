'use client';

import { Fragment, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiCheck, FiEdit2, FiPlus } from "react-icons/fi";
import { AdminHeader } from "@/components/AdminHeader";
import { usePlans, plansService, queryKeys } from "@/lib/query";
import { toast } from "sonner";
import { getTranslatedValue } from "@/lib/utils/translations";
import { useAuth } from "@/lib/redux";
import type { SubscriptionPlan } from "@/types";

// Brutalist neon accent for features
const NEON = "text-yellow-400";

const AdminPlans = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading, refetch } = usePlans();

  // ── FREE PLAN SETTINGS ──
  const [isFreePlanOpen, setIsFreePlanOpen] = useState(false);
  const [freeSettings, setFreeSettings] = useState<{
    messagesLimit: number | "";
    freePeriodDays: number | "";
    storageLimit: number | "";
  }>({ messagesLimit: "", freePeriodDays: "", storageLimit: "" });

  useEffect(() => {
    plansService.getFreePlanSettings().then((d) => {
      setFreeSettings({
        messagesLimit: d.messagesLimit,
        freePeriodDays: d.freePeriodDays,
        storageLimit: (d as any).storageLimit ?? 1,
      });
    }).catch(() => toast.error(t("admin.settingsLoadError")));
  }, [t]);

  const { mutate: updateFreePlan, isPending: isSavingFree } = useMutation({
    mutationFn: plansService.updateFreePlanSettings,
    onSuccess: async () => {
      toast.success(t("admin.freePlanSettingsUpdated"));
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      queryClient.invalidateQueries({ queryKey: queryKeys.freePlanSettings });
      refetch();
      const updated = await plansService.getFreePlanSettings();
      setFreeSettings({ messagesLimit: updated.messagesLimit, freePeriodDays: updated.freePeriodDays, storageLimit: (updated as any).storageLimit ?? 1 });
    },
    onError: () => toast.error(t("admin.settingsUpdateError")),
  });

  // ── EDIT PLAN DIALOG ──
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editForm, setEditForm] = useState({
    price: 0,
    messagesLimit: 0,
    storageLimit: 0,
  });

  const { mutate: updatePlan, isPending: isSavingPlan } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubscriptionPlan> }) =>
      (plansService as any).update ? (plansService as any).update(id, data) : Promise.resolve(),
    onSuccess: () => {
      toast.success(t("admin.planUpdated") || "Plan updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      refetch();
      setIsEditOpen(false);
    },
    onError: (e: any) => toast.error(e.message || t("common.error")),
  });

  // ── CREATE PLAN DIALOG ──
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    price: 0,
    messagesLimit: 100,
    storageLimit: 5,
  });

  const { mutate: createPlan, isPending: isCreating } = useMutation({
    mutationFn: (data: any) => plansService.create(data),
    onSuccess: () => {
      toast.success(t("admin.planCreated") || "Plan created");
      queryClient.invalidateQueries({ queryKey: queryKeys.plans });
      refetch();
      setIsCreateOpen(false);
      setCreateForm({ name: "", price: 0, messagesLimit: 100, storageLimit: 5 });
    },
    onError: (e: any) => toast.error(e.message || t("common.error")),
  });

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditForm({ price: plan.price, messagesLimit: plan.messagesLimit, storageLimit: plan.storageLimit });
    setIsEditOpen(true);
  };

  const planColors = [
    { border: "border-foreground/40", accent: "text-foreground" },
    { border: `border-yellow-400`, accent: `text-yellow-400` },
    { border: "border-violet-500", accent: "text-violet-400" },
    { border: "border-cyan-400", accent: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="container py-6 space-y-8">

        {/* Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-foreground pb-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-foreground">PLANS</h1>
            <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest">
              {plans.length} {t("admin.totalPlans") || "plans configured"}
            </p>
          </div>
          <div className="flex gap-3">
            {user?.role === "super_admin" && (
              <Button
                onClick={() => setIsFreePlanOpen(true)}
                variant="outline"
                className="rounded-none border-2 border-foreground font-black uppercase tracking-wider gap-2"
              >
                FREE PLAN SETTINGS
              </Button>
            )}
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider gap-2"
            >
              <FiPlus className="h-4 w-4" />
              NEW PLAN
            </Button>
          </div>
        </div>

        {/* Plans grid */}
        {isLoading ? (
          <div className="text-center py-16 font-mono uppercase tracking-widest text-muted-foreground text-xs">
            {t("common.loading") || "LOADING..."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const color = planColors[idx % planColors.length];
              const isFree = plan.price === 0;
              const planName = typeof plan.name === "string" ? plan.name : getTranslatedValue(plan.name);
              return (
                <Card
                  key={plan.id}
                  className={`rounded-none border-2 ${color.border} bg-card p-6 flex flex-col gap-5 relative overflow-hidden`}
                >
                  {/* Accent stripe */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-current ${color.accent}`} />

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className={`text-lg font-black uppercase tracking-widest ${color.accent}`}>
                        {planName.toUpperCase()}
                      </h2>
                      {isFree && (
                        <span className="inline-block mt-1 border border-foreground/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          FREE TIER
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(plan)}
                      className={`rounded-none border border-current ${color.accent} hover:bg-foreground/10 h-8 w-8 flex-shrink-0`}
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Price */}
                  <div>
                    {isFree ? (
                      <p className="font-black font-mono text-4xl text-foreground">FREE</p>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className={`font-black font-mono text-4xl ${color.accent}`}>{plan.price.toLocaleString()}</span>
                        <span className="font-mono text-xs text-muted-foreground uppercase">₸ / mo</span>
                      </div>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="space-y-1.5 border-t border-foreground/20 pt-4">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="uppercase tracking-wider text-muted-foreground">MESSAGES</span>
                      <span className="font-bold text-foreground">{plan.messagesLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="uppercase tracking-wider text-muted-foreground">STORAGE</span>
                      <span className="font-bold text-foreground">{plan.storageLimit} GB</span>
                    </div>
                    {(plan as any).companyCount !== undefined && (
                      <div className="flex justify-between font-mono text-xs">
                        <span className="uppercase tracking-wider text-muted-foreground">COMPANIES</span>
                        <span className="font-bold text-foreground">{(plan as any).companyCount}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-2 border-t border-foreground/20 pt-4">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                          <FiCheck className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${NEON}`} />
                          <span>{typeof f === "string" ? f : getTranslatedValue(f)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Free Plan Settings section (inline) */}
        {user?.role === "super_admin" && (
          <div className="border-t-4 border-foreground pt-6 space-y-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground">
              FREE PLAN SETTINGS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
              <div className="space-y-1.5">
                <Label className="font-mono uppercase text-xs tracking-widest">TRIAL DAYS</Label>
                <Input
                  type="number"
                  min={0}
                  value={freeSettings.freePeriodDays}
                  onChange={(e) => setFreeSettings({ ...freeSettings, freePeriodDays: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="rounded-none border-2 border-foreground font-mono"
                  placeholder="14"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono uppercase text-xs tracking-widest">MSG LIMIT</Label>
                <Input
                  type="number"
                  min={1}
                  value={freeSettings.messagesLimit}
                  onChange={(e) => setFreeSettings({ ...freeSettings, messagesLimit: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="rounded-none border-2 border-foreground font-mono"
                  placeholder="10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono uppercase text-xs tracking-widest">STORAGE (GB)</Label>
                <Input
                  type="number"
                  min={1}
                  value={freeSettings.storageLimit}
                  onChange={(e) => setFreeSettings({ ...freeSettings, storageLimit: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="rounded-none border-2 border-foreground font-mono"
                  placeholder="1"
                />
              </div>
            </div>
            <Button
              disabled={isSavingFree}
              onClick={() => {
                const messagesLimit = freeSettings.messagesLimit === "" ? 1 : Math.max(1, Number(freeSettings.messagesLimit));
                const freePeriodDays = freeSettings.freePeriodDays === "" ? 0 : Math.max(0, Number(freeSettings.freePeriodDays));
                const storageLimit = freeSettings.storageLimit === "" ? 1 : Math.max(1, Number(freeSettings.storageLimit));
                updateFreePlan({ messagesLimit, storageLimit, freePeriodDays });
              }}
              className="rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider"
            >
              {isSavingFree ? "SAVING..." : "SAVE FREE PLAN"}
            </Button>
          </div>
        )}
      </main>

      {/* ── FREE PLAN DIALOG (alternative entry) ── */}
      <Transition show={isFreePlanOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsFreePlanOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    FREE PLAN SETTINGS
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">TRIAL PERIOD (DAYS)</Label>
                      <Input type="number" min={0} value={freeSettings.freePeriodDays} onChange={(e) => setFreeSettings({ ...freeSettings, freePeriodDays: e.target.value === "" ? "" : Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">MESSAGES LIMIT</Label>
                      <Input type="number" min={1} value={freeSettings.messagesLimit} onChange={(e) => setFreeSettings({ ...freeSettings, messagesLimit: e.target.value === "" ? "" : Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">STORAGE LIMIT (GB)</Label>
                      <Input type="number" min={1} value={freeSettings.storageLimit} onChange={(e) => setFreeSettings({ ...freeSettings, storageLimit: e.target.value === "" ? "" : Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsFreePlanOpen(false)}>CANCEL</Button>
                    <Button
                      disabled={isSavingFree}
                      onClick={() => {
                        const messagesLimit = freeSettings.messagesLimit === "" ? 1 : Math.max(1, Number(freeSettings.messagesLimit));
                        const freePeriodDays = freeSettings.freePeriodDays === "" ? 0 : Math.max(0, Number(freeSettings.freePeriodDays));
                        const storageLimit = freeSettings.storageLimit === "" ? 1 : Math.max(1, Number(freeSettings.storageLimit));
                        updateFreePlan({ messagesLimit, storageLimit, freePeriodDays });
                      }}
                      className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider"
                    >
                      {isSavingFree ? "SAVING..." : "SAVE"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── EDIT PLAN DIALOG ── */}
      <Transition show={isEditOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    EDIT PLAN — {editingPlan ? (typeof editingPlan.name === "string" ? editingPlan.name : getTranslatedValue(editingPlan.name)).toUpperCase() : ""}
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">PRICE (₸/mo)</Label>
                      <Input type="number" min={0} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono text-xl font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">MESSAGES LIMIT</Label>
                      <Input type="number" min={1} value={editForm.messagesLimit} onChange={(e) => setEditForm({ ...editForm, messagesLimit: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">STORAGE LIMIT (GB)</Label>
                      <Input type="number" min={1} value={editForm.storageLimit} onChange={(e) => setEditForm({ ...editForm, storageLimit: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsEditOpen(false)}>CANCEL</Button>
                    <Button
                      disabled={isSavingPlan}
                      onClick={() => editingPlan && updatePlan({ id: editingPlan.id, data: editForm })}
                      className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider"
                    >
                      {isSavingPlan ? "SAVING..." : "SAVE"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── CREATE PLAN DIALOG ── */}
      <Transition show={isCreateOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm bg-card border-2 border-foreground p-6 space-y-5">
                  <Dialog.Title className="text-xl font-black uppercase tracking-widest text-foreground border-b-2 border-foreground pb-3">
                    NEW PLAN
                  </Dialog.Title>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">PLAN NAME</Label>
                      <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="rounded-none border-2 border-foreground font-mono uppercase" placeholder="ENTERPRISE" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">PRICE (₸/mo)</Label>
                      <Input type="number" min={0} value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">MESSAGES LIMIT</Label>
                      <Input type="number" min={1} value={createForm.messagesLimit} onChange={(e) => setCreateForm({ ...createForm, messagesLimit: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-mono uppercase text-xs tracking-widest">STORAGE LIMIT (GB)</Label>
                      <Input type="number" min={1} value={createForm.storageLimit} onChange={(e) => setCreateForm({ ...createForm, storageLimit: Number(e.target.value) })} className="rounded-none border-2 border-foreground font-mono" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-none border-2 border-foreground font-black uppercase tracking-wider" onClick={() => setIsCreateOpen(false)}>CANCEL</Button>
                    <Button
                      disabled={isCreating || !createForm.name}
                      onClick={() => createPlan(createForm)}
                      className="flex-1 rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black uppercase tracking-wider"
                    >
                      {isCreating ? "CREATING..." : "CREATE"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AdminPlans;
