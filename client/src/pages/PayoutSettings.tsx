import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CreditCard, DollarSign, CheckCircle, Clock, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import TrackingHeader from "../components/layout/TrackingHeader";

interface PayoutAccount {
  id: string;
  type: "bank" | "debit_card";
  last4: string;
  bankName?: string;
  isDefault: boolean;
  status: "pending" | "verified" | "failed";
}

interface PayoutHistory {
  id: string;
  amount: number;
  status: "pending" | "processing" | "paid" | "failed";
  date: string;
  accountLast4: string;
  estimatedArrival?: string;
}

interface UserBalance {
  available: number;
  pending: number;
  totalEarned: number;
  role: "partner" | "manager";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const PayoutSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [history, setHistory] = useState<PayoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  // Determine where user came from to provide proper back navigation
  const fromDashboard = (location.state as any)?.from || 
    (balance?.role === "manager" ? "/manager-dashboard" : "/engagement-dashboard");

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    try {
      // TODO: Replace with actual API calls
      setBalance({
        available: 890,
        pending: 125,
        totalEarned: 2340,
        role: "partner",
      });

      setAccounts([
        {
          id: "ba_1",
          type: "bank",
          last4: "4242",
          bankName: "Chase Bank",
          isDefault: true,
          status: "verified",
        },
      ]);

      setHistory([
        {
          id: "po_1",
          amount: 450,
          status: "paid",
          date: new Date(Date.now() - 7 * 86400000).toISOString(),
          accountLast4: "4242",
        },
        {
          id: "po_2",
          amount: 320,
          status: "processing",
          date: new Date(Date.now() - 2 * 86400000).toISOString(),
          accountLast4: "4242",
          estimatedArrival: new Date(Date.now() + 2 * 86400000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Failed to load payout data:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || amount > (balance?.available || 0)) {
      alert("Invalid payout amount");
      return;
    }

    try {
      // TODO: Call actual payout API
      alert(`Payout request for $${amount} submitted successfully!`);
      setPayoutAmount("");
      loadPayoutData();
    } catch (error) {
      console.error("Failed to request payout:", error);
      alert("Failed to process payout request");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ backgroundColor: "#f0f7ff" }}>
        <TrackingHeader />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div className="mt-3 text-sm text-slate-600">Loading payout settings</div>
          </div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: "#f0f7ff" }}>
      <TrackingHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(fromDashboard)}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Payout Settings
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your earnings and payout methods
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
            <div className="text-xs font-medium text-slate-500">Account Type</div>
            <div className="text-sm font-semibold capitalize text-slate-900">{balance.role}</div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">Available Balance</span>
            </div>
            <div className="mt-4 text-4xl font-bold">{formatCurrency(balance.available)}</div>
            <div className="mt-2 text-xs opacity-75">Ready to withdraw</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-600">Pending</span>
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">
              {formatCurrency(balance.pending)}
            </div>
            <div className="mt-2 text-xs text-slate-500">Processing conversions</div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-600">Total Earned</span>
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">
              {formatCurrency(balance.totalEarned)}
            </div>
            <div className="mt-2 text-xs text-slate-500">All-time earnings</div>
          </div>
        </div>

        {/* Request Payout */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Request Payout</h2>
          <p className="mt-1 text-sm text-slate-600">
            Transfer your available balance to your bank account
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Amount</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max={balance.available}
                  step="0.01"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-lg font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Minimum: $10.00</span>
                <button
                  onClick={() => setPayoutAmount(balance.available.toString())}
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Use max: {formatCurrency(balance.available)}
                </button>
              </div>
            </div>

            <button
              onClick={requestPayout}
              disabled={!payoutAmount || parseFloat(payoutAmount) < 10}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Request Payout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {accounts.length === 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-amber-900">No payout method</div>
                  <div className="mt-1 text-xs text-amber-700">
                    Add a bank account or debit card to receive payouts
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payout Methods */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Payout Methods</h2>
              <p className="mt-1 text-sm text-slate-600">Manage your bank accounts and cards</p>
            </div>
            <button
              onClick={() => setShowAddAccount(true)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Account
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 ring-1 ring-blue-200">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {account.bankName || "Bank Account"} ••••{account.last4}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="capitalize">{account.type.replace("_", " ")}</span>
                      {account.isDefault && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-emerald-600">Default</span>
                        </>
                      )}
                      {account.status === "verified" && (
                        <>
                          <span>•</span>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
                <div className="mt-4 text-sm font-medium text-slate-600">No payout methods</div>
                <div className="mt-1 text-xs text-slate-500">
                  Add a bank account to receive your earnings
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Payout History</h2>
          <p className="mt-1 text-sm text-slate-600">Track all your past and pending payouts</p>

          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <table className="min-w-full bg-white text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Arrival</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600">{formatDate(payout.date)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">••••{payout.accountLast4}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1",
                          payout.status === "paid" &&
                            "bg-green-50 text-green-700 ring-green-200",
                          payout.status === "processing" &&
                            "bg-blue-50 text-blue-700 ring-blue-200",
                          payout.status === "pending" &&
                            "bg-amber-50 text-amber-700 ring-amber-200",
                          payout.status === "failed" && "bg-red-50 text-red-700 ring-red-200"
                        )}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {payout.estimatedArrival
                        ? formatDate(payout.estimatedArrival)
                        : payout.status === "paid"
                        ? "Completed"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {history.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-sm font-medium text-slate-600">No payout history</div>
                <div className="mt-1 text-xs text-slate-500">
                  Your payout requests will appear here
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutSettings;
