import React, { useState, useMemo } from "react";

import MyProgressDashboard, { WihyCoachModel } from "../dashboard/MyProgressDashboard";
import { PlatformDetectionService } from "../../services/shared/platformDetectionService";
import Header from "../shared/Header";
import "../../styles/VHealthSearch.css";
import "../../styles/Dashboard.css";

type ClientStatus = "active" | "paused" | "prospect";

type CoachClient = {
  id: string;
  name: string;
  email: string;
  goal?: string;
  status: ClientStatus;
  plan: WihyCoachModel;
};

type ActionType =
  | "workout"
  | "meal"
  | "hydration"
  | "log"
  | "habit"
  | "checkin"
  | "education"
  | "custom";

type ActionStatus = "pending" | "in_progress" | "completed";

// ----- Seed data (local only) -----
const seedClients: CoachClient[] = [
  {
    id: "c1",
    name: "Alex Johnson",
    email: "alex@example.com",
    goal: "Lose 10–15 lb in 12 weeks",
    status: "active",
    plan: {
      summary: "We are focusing on sustainable fat loss and daily movement.",
      motivation:
        "Small consistent changes over 12 weeks will matter more than a perfect week.",
      priorities: [
        {
          id: "g1",
          title: "Walk 6,000–8,000 steps at least 5 days per week",
          description: "Short walks after meals are great.",
          icon: "🚶‍♂️",
        },
        {
          id: "g2",
          title: "Hit protein target 4+ days per week",
          description: "Use Greek yogurt and prepared protein to help.",
          icon: "🍗",
        },
      ],
      actions: [
        {
          id: "a1",
          type: "workout",
          title: "Complete Workout A",
          description: "Full-body strength, 30–40 minutes.",
          status: "pending",
          meta: "3 sets each exercise",
        },
        {
          id: "a2",
          type: "meal",
          title: "Log all meals today",
          description: "No judgment, just awareness.",
          status: "pending",
        },
      ],
    },
  },
  {
    id: "c2",
    name: "Taylor Brooks",
    email: "taylor@example.com",
    goal: "Build lean muscle",
    status: "active",
    plan: {
      summary: "We are building strength and muscle with progressive overload.",
      motivation:
        "You do not need perfection; you need consistent training and recovery.",
      priorities: [
        {
          id: "g3",
          title: "3 strength workouts per week",
          icon: "🏋️",
        },
        {
          id: "g4",
          title: "Hit protein at least 5 days per week",
          icon: "🥚",
        },
      ],
      actions: [
        {
          id: "a3",
          type: "workout",
          title: "Upper body strength session",
          status: "pending",
        },
      ],
    },
  },
];

const CoachClientsPage: React.FC = () => {
  const [clients, setClients] = useState<CoachClient[]>(seedClients);
  const [selectedClientId, setSelectedClientId] = useState<string>(seedClients[0]?.id);
  const [search, setSearch] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId]
  );

  const [editingGoals, setEditingGoals] = useState<WihyCoachModel["priorities"]>(
    selectedClient?.plan?.priorities ?? []
  );
  const [editingActions, setEditingActions] = useState<WihyCoachModel["actions"]>(
    selectedClient?.plan?.actions ?? []
  );

  React.useEffect(() => {
    if (!selectedClient) return;
    setEditingGoals(selectedClient.plan?.priorities ?? []);
    setEditingActions(selectedClient.plan?.actions ?? []);
  }, [selectedClientId, selectedClient]);

  const handleToggleActionStatus = (id: string) => {
    setEditingActions((prev) =>
      (prev ?? []).map((a) =>
        a.id === id
          ? {
              ...a,
              status:
                a.status === "completed"
                  ? "pending"
                  : a.status === "pending"
                  ? "in_progress"
                  : "completed",
            }
          : a
      )
    );
  };

  const handleRemoveAction = (id: string) => {
    setEditingActions((prev) => (prev ?? []).filter((a) => a.id !== id));
  };

  const [newActionType, setNewActionType] = useState<ActionType>("workout");
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionDescription, setNewActionDescription] = useState("");
  const [newActionMeta, setNewActionMeta] = useState("");

  const handleAddAction = () => {
    if (!newActionTitle.trim()) return;
    const newAction = {
      id: `action-${Date.now()}`,
      type: newActionType,
      title: newActionTitle.trim(),
      description: newActionDescription.trim() || undefined,
      meta: newActionMeta.trim() || undefined,
      status: "pending" as ActionStatus,
    };
    setEditingActions((prev) => [...(prev ?? []), newAction]);

    setNewActionTitle("");
    setNewActionDescription("");
    setNewActionMeta("");
    setNewActionType("workout");
  };

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("");

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    const newGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim() || undefined,
      icon: newGoalIcon.trim() || undefined,
    };
    setEditingGoals((prev) => [...(prev ?? []), newGoal]);

    setNewGoalTitle("");
    setNewGoalDescription("");
    setNewGoalIcon("");
  };

  const handleRemoveGoal = (id: string) => {
    setEditingGoals((prev) => (prev ?? []).filter((g) => g.id !== id));
  };

  const handleSaveToLocalClient = () => {
    if (!selectedClient) return;

    const updatedPlan: WihyCoachModel = {
      ...(selectedClient.plan ?? {}),
      priorities: editingGoals ?? [],
      actions: editingActions ?? [],
    };

    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClient.id ? { ...c, plan: updatedPlan } : c
      )
    );
  };

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, 
        backgroundColor: 'white',
        paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
      }}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          showProgressMenu={false}
        />
      </div>

      <div className="w-full bg-[#f0f7ff] min-h-[70vh] relative" style={{ paddingTop: PlatformDetectionService.isNative() ? '200px' : '160px' }}>
        <header className="flex flex-col gap-2 pb-4">
          <h1 className="dashboard-title text-[22px] text-center mb-3 mt-2 px-2 leading-normal">
            Coach Portal – Client Plans
          </h1>
          <p className="text-sm text-slate-600 text-center">
            Manage your clients' goals and action items.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6">
            <section className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-4 py-1">
                <h2 className="text-sm font-semibold text-slate-800 leading-relaxed">Your Clients</h2>
                <span className="text-sm text-slate-600">
                  {clients.length} total
                </span>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {filteredClients.map((client) => {
                  const active = client.id === selectedClientId;
                  const statusLabel =
                    client.status === "active"
                      ? "Active"
                      : client.status === "paused"
                      ? "Paused"
                      : "Prospect";

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full text-left rounded-xl px-3 py-3 text-sm border transition-colors ${
                        active
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-100 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-800">{client.name}</div>
                          <div className="text-xs text-slate-600">
                            {client.email}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="inline-flex items-center rounded-full border px-2 py-1 text-xs border-slate-200 text-slate-600 bg-slate-50">
                            {statusLabel}
                          </div>
                          {client.goal && (
                            <div className="mt-1 text-slate-500">{client.goal}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedClient && (
              <section className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between py-1">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 leading-relaxed">{selectedClient.name}</h2>
                    <p className="text-sm text-slate-600">
                      {selectedClient.email}
                      {selectedClient.goal ? ` · Goal: ${selectedClient.goal}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveToLocalClient}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                  >
                    Save to local state
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
                      Goals (priorities)
                    </h3>
                    <div className="space-y-2 overflow-y-auto pr-1">
                      {(editingGoals ?? []).length === 0 && (
                        <p className="text-sm text-slate-500">
                          No goals added yet. Use this to define what success looks
                          like for this client.
                        </p>
                      )}
                      {(editingGoals ?? []).map((goal) => (
                        <div
                          key={goal.id}
                          className="rounded-xl bg-white border border-slate-100 px-3 py-3 text-sm flex justify-between gap-2 shadow-sm"
                        >
                          <div className="flex gap-2">
                            {goal.icon && (
                              <span className="text-lg leading-none mt-0.5">
                                {goal.icon}
                              </span>
                            )}
                            <div>
                              <div className="font-semibold text-slate-800">
                                {goal.title}
                              </div>
                              {goal.description && (
                                <p className="text-slate-500 mt-1 text-sm">
                                  {goal.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal(goal.id)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-slate-200 pt-3 space-y-3 text-sm">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Goal title
                        </label>
                        <input
                          type="text"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="Example: Lose 10–15 lb in 12 weeks"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          value={newGoalDescription}
                          onChange={(e) => setNewGoalDescription(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Icon (optional)
                        </label>
                        <input
                          type="text"
                          value={newGoalIcon}
                          onChange={(e) => setNewGoalIcon(e.target.value)}
                          placeholder="Example: 🎯"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddGoal}
                          className="rounded-lg border border-blue-500 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
                        >
                          Add goal
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
                      Daily action items
                    </h3>

                    <div className="space-y-2 overflow-y-auto pr-1">
                      {(editingActions ?? []).length === 0 && (
                        <p className="text-sm text-slate-500">
                          No actions assigned. Add 2–5 clear steps for today or this
                          week.
                        </p>
                      )}

                      {(editingActions ?? []).map((action) => (
                        <div
                          key={action.id}
                          className="rounded-xl bg-white border border-slate-100 px-3 py-3 text-sm flex justify-between gap-2 shadow-sm"
                        >
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleActionStatus(action.id)}
                              className={`mt-0.5 h-4 w-4 rounded border ${
                                action.status === "completed"
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-slate-300 bg-white"
                              }`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800">
                                  {action.title}
                                </span>
                                <span className="text-xs uppercase tracking-wide text-slate-500">
                                  {action.type}
                                </span>
                              </div>
                              {action.description && (
                                <p className="text-slate-500 mt-1 text-sm">
                                  {action.description}
                                </p>
                              )}
                              {action.meta && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {action.meta}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 mt-1">
                                Status:{" "}
                                <span className="font-medium">
                                  {action.status}
                                </span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(action.id)}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 border-t border-slate-200 pt-3 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">
                            Type
                          </label>
                          <select
                            value={newActionType}
                            onChange={(e) =>
                              setNewActionType(e.target.value as ActionType)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="workout">Workout</option>
                            <option value="meal">Meal / food</option>
                            <option value="hydration">Hydration</option>
                            <option value="habit">Habit</option>
                            <option value="log">Log / track</option>
                            <option value="checkin">Check-in</option>
                            <option value="education">Education</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newActionTitle}
                          onChange={(e) => setNewActionTitle(e.target.value)}
                          placeholder="Example: Walk 20–30 minutes after dinner"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          value={newActionDescription}
                          onChange={(e) =>
                            setNewActionDescription(e.target.value)
                          }
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Meta (optional)
                        </label>
                        <input
                          type="text"
                          value={newActionMeta}
                          onChange={(e) => setNewActionMeta(e.target.value)}
                          placeholder='Example: "3 sets of 10", "4/6 cups"'
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddAction}
                          className="rounded-lg border border-blue-500 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors"
                        >
                          Add action
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-600 mb-3">
                    Preview of what this client will see in their dashboard:
                  </p>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <MyProgressDashboard
                      coach={{
                        ...(selectedClient.plan ?? {}),
                        priorities: editingGoals ?? [],
                        actions: editingActions ?? [],
                      }}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
      </div>
    </>
  );
};

export default CoachClientsPage;
