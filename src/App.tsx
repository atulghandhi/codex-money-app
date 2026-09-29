import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Plus,
  Wallet,
  Activity,
  CalendarDays,
  Sprout,
  Settings,
  ShieldCheck,
  ArrowRight,
  MoveUpRight,
  X,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpLeft,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  Check,
  Trash2,
  Pencil,
  Info,
  RotateCcw,
  Home,
  ShoppingBag,
  Coffee,
  Train,
  Repeat,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  TrendingDown,
  Heart,
  Compass,
} from "lucide-react";
import { read, change } from "./db";
import {
  finance,
  money,
  shortDate,
  dateKey,
  addDays,
  dayDiff,
  nextMonth,
  uid,
  cents,
  blank,
  seed,
  validateData,
  payoff,
  type Data,
  type Transaction,
  type Bill,
  type Goal,
  type Debt,
} from "./model";
import { Landscape, colors } from "./Landscape";
type Page = "money" | "activity" | "plan" | "goals";
type Modal = {
  type:
    | "transaction"
    | "bill"
    | "goal"
    | "debt"
    | "settings"
    | "start"
    | "fund"
    | "delete"
    | "restore"
    | "explain"
    | "reverse";
  item?: Transaction | Bill | Goal | Debt;
  collection?: "transactions" | "bills" | "goals" | "debts";
  amount?: number;
  data?: Data;
};
const categories = [
  "Groceries",
  "Eating out",
  "Transport",
  "Home",
  "Bills",
  "Subscriptions",
  "Shopping",
  "Travel",
  "Health",
  "Other",
];
const navItems = [
  { page: "money" as Page, icon: Wallet, label: "Your money" },
  { page: "activity" as Page, icon: Activity, label: "Activity" },
  { page: "plan" as Page, icon: CalendarDays, label: "Plan ahead" },
  { page: "goals" as Page, icon: Sprout, label: "Goals & debts" },
];
const categoryIcon = (cat: string) =>
  cat === "Home"
    ? Home
    : cat === "Eating out"
      ? Coffee
      : cat === "Transport"
        ? Train
        : cat === "Groceries" || cat === "Shopping"
          ? ShoppingBag
          : cat === "Income"
            ? ArrowDownLeft
            : Wallet;
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function NumberInput({
  name,
  value = 0,
  min = 0,
  max = 999999999,
  step = "0.01",
  required = true,
}: {
  name: string;
  value?: number;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <input
      type="number"
      name={name}
      defaultValue={value}
      min={min}
      max={max}
      step={step}
      required={required}
    />
  );
}
function App() {
  const [data, setData] = useState<Data>();
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState<Page>("money");
  const [selected, setSelected] = useState(4);
  const [details, setDetails] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [offset, setOffset] = useState(0);
  const [simulate, setSimulate] = useState(false);
  const [purchase, setPurchase] = useState(15000);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [today, setToday] = useState(dateKey());
  const importRef = useRef<HTMLInputElement>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    read()
      .then(setData)
      .catch((e) => setLoadError(e.message));
    const bc = new BroadcastChannel("pocketroom-updates");
    channel.current = bc;
    bc.onmessage = () =>
      read()
        .then(setData)
        .catch((e) => setLoadError(e.message));
    const timer = setInterval(() => setToday(dateKey()), 30000);
    return () => {
      bc.close();
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    setError("");
  }, [modal]);
  async function save(
    update: (d: Data) => Data,
    message: string,
    close = true,
  ) {
    setBusy(true);
    setError("");
    try {
      const next = await change(update);
      setData(next);
      channel.current?.postMessage("changed");
      setToast(message);
      if (close) setModal(null);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your change could not be saved. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  const open = (m: Modal) => {
    setError("");
    setModal(m);
  };
  if (loadError)
    return (
      <div className="loading">
        <AlertCircle />
        <h1>Your money is still yours.</h1>
        <p>
          Pocketroom couldn’t open its local database. {loadError} Check that
          browser storage is enabled, then reload.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="loading">
        <span className="brand-mark">p</span>
        <p>Opening your pocketroom…</p>
      </div>
    );
  const currency = data.settings.currency;
  const m = (n: number, decimal = n % 100 !== 0) => money(n, currency, decimal);
  const f = finance(data, offset, simulate ? purchase : 0, today);
  const base = finance(data, 0, 0, today);
  const values = [f.bills, f.essentials, f.savings, f.buffer, f.free];
  const allocationNames = [
    "Bills & plans",
    "Everyday living",
    "Future you",
    "Safety buffer",
    "Free to spend",
  ];
  const spent = data.transactions.filter(
    (t) =>
      t.kind === "expense" && t.date >= addDays(today, -29) && t.date <= today,
  );
  const spentTotal = spent.reduce((s, t) => s + t.amount, 0);
  const categoryTotals = categories
    .map((name, i) => ({
      name,
      value: spent
        .filter((t) => t.category === name)
        .reduce((s, t) => s + t.amount, 0),
      color: ["#bbb0d8", "#dfaf83", "#9bbbad", "#b9c693", "#d4c097", "#b0bfd2"][
        i % 6
      ],
    }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  const upcoming = base.list;
  const nextEvent = upcoming.find((e) => offset === 0 || e.date >= f.at);
  const pageTitle = navItems.find((n) => n.page === page)!.label;
  function go(p: Page) {
    setPage(p);
    setOffset(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!modal) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const amount = cents(form.get("amount"));
    const date = String(form.get("date") || today);
    const type = modal.type;
    const id = modal.item?.id ?? uid();
    if (["transaction", "bill", "goal", "debt"].includes(type) && !name) {
      setError("Give this a name so you can recognise it later.");
      return;
    }
    if (type === "transaction") {
      const kind = String(form.get("kind")) as "expense" | "income";
      const item: Transaction = {
        id,
        name,
        amount,
        date,
        category: kind === "income" ? "Income" : String(form.get("category")),
        kind,
      };
      await save(
        (d) => ({
          ...d,
          transactions: modal.item
            ? d.transactions.map((t) => (t.id === id ? item : t))
            : [item, ...d.transactions],
        }),
        modal.item ? "Transaction updated" : "Transaction added",
      );
    }
    if (type === "bill") {
      const item: Bill = {
        id,
        name,
        amount,
        date,
        category: String(form.get("category")),
        recurring: form.get("recurring") === "on",
      };
      await save(
        (d) => ({
          ...d,
          bills: modal.item
            ? d.bills.map((b) => (b.id === id ? item : b))
            : [...d.bills, item],
        }),
        "Plan saved",
      );
    }
    if (type === "goal") {
      const item: Goal = {
        id,
        name,
        target: amount,
        saved: cents(form.get("saved")),
        contribution: cents(form.get("contribution")),
        color: (modal.item as Goal)?.color ?? colors[data!.goals.length % 3],
      };
      await save(
        (d) => ({
          ...d,
          goals: modal.item
            ? d.goals.map((g) => (g.id === id ? item : g))
            : [...d.goals, item],
        }),
        "Savings goal saved",
      );
    }
    if (type === "debt") {
      const item: Debt = {
        id,
        name,
        balance: amount,
        apr: Number(form.get("apr")),
        payment: cents(form.get("payment")),
        date,
      };
      await save(
        (d) => ({
          ...d,
          debts: modal.item
            ? d.debts.map((g) => (g.id === id ? item : g))
            : [...d.debts, item],
        }),
        "Debt saved",
      );
    }
    if (type === "settings" || type === "start") {
      const settings = {
        name: String(form.get("name")).trim(),
        currency: String(form.get("currency")),
        openingBalance: cents(form.get("balance")),
        payday: String(form.get("payday")),
        income: cents(form.get("income")),
        dailyEssentials: cents(form.get("dailyEssentials")),
        buffer: cents(form.get("buffer")),
      };
      await save(
        (d) => {
          const current = type === "start" ? blank() : d;
          const txNet = current.transactions.reduce(
            (s, t) => s + (t.kind === "income" ? t.amount : -t.amount),
            0,
          );
          return {
            ...current,
            demo: type === "start" ? false : current.demo,
            settings: {
              ...settings,
              openingBalance: settings.openingBalance - txNet,
            },
          };
        },
        type === "start"
          ? "Your fresh start is ready"
          : "Your money settings are updated",
      );
      setOffset(0);
      setSimulate(false);
    }
    if (type === "fund") {
      await save((d) => {
        const goal = d.goals.find((g) => g.id === id);
        if (!goal) throw new Error("This goal no longer exists.");
        if (amount > Math.max(0, goal.target - goal.saved))
          throw new Error("This amount is larger than the remaining goal.");
        if (amount > finance(d).cash)
          throw new Error(
            "This is more than your current spending-account balance.",
          );
        return {
          ...d,
          goals: d.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  saved: g.saved + amount,
                  contribution: Math.max(0, g.contribution - amount),
                }
              : g,
          ),
          transactions: [
            {
              id: uid(),
              name: `Saved · ${goal.name}`,
              amount,
              date: today,
              category: "Savings",
              kind: "transfer",
              linkId: id,
              reversal: {
                kind: "goal",
                reserveUsed: Math.min(goal.contribution, amount),
              },
            },
            ...d.transactions,
          ],
        };
      }, "A little closer. Savings recorded.");
    }
  }
  async function payBill(b: Bill) {
    await save(
      (d) => {
        const current = d.bills.find((x) => x.id === b.id);
        if (!current || current.date !== b.date)
          throw new Error("This payment has already changed.");
        return {
          ...d,
          bills: current.recurring
            ? d.bills.map((x) =>
                x.id === b.id ? { ...x, date: nextMonth(x.date) } : x,
              )
            : d.bills.filter((x) => x.id !== b.id),
          transactions: [
            {
              id: uid(),
              name: current.name,
              amount: current.amount,
              date: today,
              category: current.category,
              kind: "expense",
              linkId: current.id,
              reversal: { kind: "bill", bill: current },
            },
            ...d.transactions,
          ],
        };
      },
      `${b.name} marked as paid`,
      false,
    );
  }
  async function payDebt(debt: Debt) {
    await save(
      (d) => {
        const current = d.debts.find((x) => x.id === debt.id);
        if (!current || current.date !== debt.date)
          throw new Error("This payment has already changed.");
        const amount = Math.min(current.payment, current.balance);
        return {
          ...d,
          debts: d.debts.map((x) =>
            x.id === current.id
              ? {
                  ...x,
                  balance: Math.max(0, x.balance - amount),
                  date: nextMonth(x.date),
                }
              : x,
          ),
          transactions: [
            {
              id: uid(),
              name: `Payment · ${current.name}`,
              amount,
              date: today,
              category: "Debt payment",
              kind: "transfer",
              linkId: current.id,
              reversal: { kind: "debt", previousDate: current.date },
            },
            ...d.transactions,
          ],
        };
      },
      "Payment recorded. Update your debt balance from your statement to include interest.",
      false,
    );
  }
  async function reverseTransaction(t: Transaction) {
    await save((d) => {
      const record = d.transactions.find((x) => x.id === t.id);
      if (!record || !record.reversal)
        throw new Error("This record is no longer available to undo.");
      let next = {
        ...d,
        transactions: d.transactions.filter((x) => x.id !== t.id),
      };
      const r = record.reversal;
      if (r.kind === "bill") {
        const current = d.bills.find((x) => x.id === t.linkId);
        if (current && current.date !== nextMonth(r.bill.date))
          throw new Error(
            "This bill has changed since the payment. Update its plan manually before correcting the cash balance.",
          );
        next.bills = [...d.bills.filter((x) => x.id !== t.linkId), r.bill];
      }
      if (r.kind === "goal") {
        const current = d.goals.find((x) => x.id === t.linkId);
        if (!current || current.saved < t.amount)
          throw new Error(
            "This goal has changed. Reconcile its balance before correcting the cash balance.",
          );
        next.goals = d.goals.map((x) =>
          x.id === t.linkId
            ? {
                ...x,
                saved: x.saved - t.amount,
                contribution: x.contribution + r.reserveUsed,
              }
            : x,
        );
      }
      if (r.kind === "debt") {
        const current = d.debts.find((x) => x.id === t.linkId);
        if (!current || current.date !== nextMonth(r.previousDate))
          throw new Error(
            "This debt has changed since the payment. Undo any later payment first.",
          );
        next.debts = d.debts.map((x) =>
          x.id === t.linkId
            ? { ...x, balance: x.balance + t.amount, date: r.previousDate }
            : x,
        );
      }
      return next;
    }, "Payment undone. Your balance and plan are back in sync.");
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pocketroom-${today}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Backup downloaded. Keep it somewhere safe.");
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10000000)
        throw new Error("Please choose a backup smaller than 10 MB.");
      const parsed = JSON.parse(await file.text());
      if (!validateData(parsed))
        throw new Error("This is not a valid Pocketroom backup.");
      open({ type: "restore", data: parsed });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not read the backup.");
    }
    if (importRef.current) importRef.current.value = "";
  }
  const recent = [...data.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  function transactionRow(t: Transaction) {
    const Icon = categoryIcon(t.category);
    return (
      <div className="transaction-row" key={t.id}>
        <span
          className={`category-icon ${t.kind === "income" ? "income" : ""}`}
        >
          <Icon size={18} />
        </span>
        <div className="row-name">
          <strong>{t.name}</strong>
          <small>
            {t.category}
            {t.linkId ? " · Recorded payment" : ""}
          </small>
        </div>
        <span className="row-date">
          {t.date === today ? "Today" : shortDate(t.date)}
        </span>
        <strong
          className={`row-amount ${t.kind === "income" ? "positive" : ""}`}
        >
          {t.kind === "income" ? "+" : "−"}
          {m(t.amount, true)}
        </strong>
        {!t.linkId ? (
          <button
            className="icon-button edit-row"
            aria-label={`Edit ${t.name}`}
            onClick={() =>
              open({ type: "transaction", item: t, collection: "transactions" })
            }
          >
            <Pencil size={15} />
          </button>
        ) : t.reversal ? (
          <button
            className="icon-button edit-row"
            aria-label={`Undo ${t.name}`}
            onClick={() => open({ type: "reverse", item: t })}
          >
            <RotateCcw size={15} />
          </button>
        ) : (
          <span
            className="locked-record"
            title="Recorded from a plan, goal, or debt"
          >
            <Check size={14} />
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("money");
          }}
        >
          <span className="brand-mark">p</span>pocketroom
          <span className="brand-dot">®</span>
        </a>
        <span className="side-caption">MAKE ROOM FOR LIFE.</span>
        <nav aria-label="Main navigation">
          {navItems.map(({ page: p, icon: Icon, label }) => (
            <button
              className={page === p ? "active" : ""}
              key={p}
              onClick={() => go(p)}
              aria-current={page === p ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
              {page === p && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-spark">✳</span>
          <p>
            More life.
            <br />
            Less money noise.
          </p>
          <span>One small step at a time.</span>
        </div>
        <div className="sidebar-bottom">
          <div className="privacy">
            <ShieldCheck size={19} />
            <div>
              Just between you & you.<small>Saved only in this browser.</small>
            </div>
          </div>
          <button
            className="profile"
            onClick={() => open({ type: "settings" })}
          >
            <span className="avatar">
              {(data.settings.name || "Y")[0].toUpperCase()}
            </span>
            <span>
              {data.settings.name
                ? `${data.settings.name}’s space`
                : "Your space"}
              <small>Settings & backups</small>
            </span>
            <Settings size={18} />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <span className="breadcrumb">{pageTitle.toUpperCase()}</span>
            <span className="header-date">
              {new Date(today + "T12:00:00").toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <div className="header-actions">
            <button
              className="mobile-settings icon-button"
              aria-label="Settings"
              onClick={() => open({ type: "settings" })}
            >
              <Settings size={19} />
            </button>
            <button
              className="primary"
              onClick={() => open({ type: "transaction" })}
            >
              <Plus size={17} />
              Add transaction
            </button>
          </div>
        </header>
        {data.demo && (
          <div className="demo-banner">
            <span>
              <b>A little room to explore.</b> You’re looking at example
              finances.
            </span>
            <button onClick={() => open({ type: "start" })}>
              Make it yours <ArrowUpRight size={15} />
            </button>
          </div>
        )}
        {!modal && error && (
          <div className="inline-error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={15} />
            </button>
          </div>
        )}
        {base.days === 0 && (
          <div className="warning">
            <AlertCircle size={18} />
            <span>
              Your payday has arrived. Record income when it lands, then choose
              your next payday so the plan stays useful.
            </span>
            <button onClick={() => open({ type: "settings" })}>
              Update plan <ArrowRight size={16} />
            </button>
          </div>
        )}
        {page === "money" && (
          <section className="overview">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE BIG PICTURE</span>
                <h1>Make room for life.</h1>
                <p>
                  Every {currency === "GBP" ? "pound" : "bit"} has a place.
                  Here’s yours.
                </p>
              </div>
              <button
                className="period"
                onClick={() => open({ type: "settings" })}
              >
                <CalendarDays size={16} />
                Today → {shortDate(data.settings.payday)}
                <small>
                  Your next payday <ChevronRight size={11} />
                </small>
              </button>
            </div>
            <div className="money-head">
              <div>
                <button
                  className="label"
                  onClick={() => open({ type: "explain" })}
                >
                  {f.free >= 0
                    ? "Yours to spend, without the guesswork"
                    : "A little attention needed before payday"}{" "}
                  <Info size={14} />
                </button>
                <div className={`hero-amount ${f.free < 0 ? "negative" : ""}`}>
                  {m(f.free)}
                  <span>
                    {f.free >= 0
                      ? "to breathe a little."
                      : "to make up before payday."}
                  </span>
                </div>
              </div>
              <div className="daily">
                <span>
                  {f.free >= 0 ? "That’s about" : "Your planned shortfall"}
                </span>
                <strong>
                  {m(Math.abs(f.daily))}
                  <small> / day</small>
                </strong>
                <span>
                  over {f.days} {f.days === 1 ? "day" : "days"} until payday
                </span>
              </div>
            </div>
            <Landscape
              values={values}
              scale={Math.max(
                base.bills,
                base.essentials,
                base.savings,
                base.buffer,
                Math.max(0, base.free),
                10000,
              )}
              currency={currency}
              selected={selected}
              onSelect={(i) => {
                setSelected(i);
                setDetails(true);
              }}
            />
            <div className="landscape-note">
              <span>
                <span className="tiny-dot" />
                {offset > 0
                  ? `Projected balance on ${shortDate(f.at)}: ${m(f.balance)}`
                  : `${m(base.cash)} in your spending account`}
              </span>
              <span>
                <span className="desktop-hint">
                  Tap a stack to take a closer look
                </span>
                <span className="mobile-hint">
                  Swipe to explore · tap for details
                </span>{" "}
                <MoveUpRight size={14} />
              </span>
            </div>
            {details && (
              <div
                className="allocation-detail"
                style={{ borderLeftColor: colors[selected] }}
              >
                <div>
                  <span className="eyebrow">{allocationNames[selected]}</span>
                  <h3>{m(values[selected])}</h3>
                </div>
                <p>
                  {selected === 0
                    ? `${upcoming.filter((e) => e.date >= f.at || offset === 0).length} scheduled payments before payday, including debt repayments. ${nextEvent ? `Next up: ${nextEvent.name}, ${m(nextEvent.amount)} on ${shortDate(nextEvent.date)}.` : ""}`
                    : selected === 1
                      ? `${m(data.settings.dailyEssentials)} per day for groceries, travel, and other everyday needs. This is your estimate, reserved for ${Math.max(0, f.days - f.day)} remaining days.`
                      : selected === 2
                        ? "The money you plan to move into your savings goals before payday. Existing savings are kept separate from your spending account."
                        : selected === 3
                          ? "A cushion you have chosen to leave untouched. It stays in your account, but we keep it out of your spending money."
                          : `Your account balance, less upcoming payments, everyday living, planned savings and your safety buffer. ${simulate ? "Your trial purchase is also deducted." : "No future income is counted until it actually arrives."}`}
                </p>
                <button
                  className="text-button"
                  onClick={() =>
                    selected === 0
                      ? go("plan")
                      : selected === 2
                        ? go("goals")
                        : open({
                            type: selected === 4 ? "explain" : "settings",
                          })
                  }
                >
                  {selected === 4 ? "See the maths" : "Manage"}{" "}
                  <ArrowRight size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Close allocation details"
                  onClick={() => setDetails(false)}
                >
                  <X size={17} />
                </button>
              </div>
            )}
            <div className="time-machine">
              <div className="time-heading">
                <div>
                  <span className="eyebrow">A LITTLE LOOK AHEAD</span>
                  <h3>
                    {offset === 0
                      ? "Today looks like this."
                      : `${shortDate(f.at)} looks like this.`}
                  </h3>
                </div>
                <span>Move through time. See what’s still yours.</span>
                {offset > 0 && (
                  <button
                    className="icon-button"
                    onClick={() => setOffset(0)}
                    aria-label="Return timeline to today"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
              <div className="timeline-track">
                <input
                  aria-label="Preview days ahead"
                  type="range"
                  min="0"
                  max={Math.max(0, f.days - 1)}
                  value={Math.min(offset, Math.max(0, f.days - 1))}
                  onChange={(e) => setOffset(Number(e.target.value))}
                />
                <div className="event-ticks">
                  {upcoming
                    .filter((e) => e.date >= today)
                    .map((e) => (
                      <button
                        key={e.id}
                        style={{
                          left: `${Math.min(100, Math.max(0, (dayDiff(today, e.date) / Math.max(1, f.days - 1)) * 100))}%`,
                        }}
                        title={`${e.name} · ${m(e.amount)} · ${shortDate(e.date)}`}
                        aria-label={`Preview ${e.name} on ${shortDate(e.date)}`}
                        onClick={() =>
                          setOffset(
                            Math.min(
                              f.days - 1,
                              Math.max(0, dayDiff(today, e.date) + 1),
                            ),
                          )
                        }
                      >
                        <span />
                      </button>
                    ))}
                </div>
              </div>
              <div className="timeline-labels">
                <span>
                  Today <b>{m(base.cash)}</b>
                </span>
                <span>
                  {nextEvent
                    ? `${nextEvent.name} · ${shortDate(nextEvent.date)}`
                    : "All clear ahead"}
                </span>
                <span>
                  Before payday{" "}
                  <b>{shortDate(addDays(data.settings.payday, -1))}</b>
                </span>
              </div>
            </div>
            <div className={`purchase-lab ${simulate ? "expanded" : ""}`}>
              <div className="preview-strip">
                <span className="lab-icon">
                  <Compass size={23} />
                </span>
                <div>
                  <span className="eyebrow">THE WHAT-IF CORNER</span>
                  <h3>Can I make room for something?</h3>
                  <p>Try a purchase. See the ripple before you spend.</p>
                </div>
                <button onClick={() => setSimulate(!simulate)}>
                  {simulate ? "Close experiment" : "Let’s find out"}
                  {simulate ? <X size={17} /> : <ArrowRight size={18} />}
                </button>
              </div>
              {simulate && (
                <div className="simulation">
                  <div className="purchase-control">
                    <Field label="What would it cost?">
                      <div className="currency-input">
                        <span>{currency}</span>
                        <input
                          aria-label="Trial purchase amount"
                          type="number"
                          min="0"
                          max="1000000"
                          step="1"
                          value={purchase / 100}
                          onChange={(e) =>
                            setPurchase(
                              Math.min(
                                100000000,
                                Math.max(
                                  0,
                                  Math.round(Number(e.target.value) * 100),
                                ),
                              ),
                            )
                          }
                        />
                      </div>
                    </Field>
                    <input
                      aria-label="Adjust trial purchase"
                      type="range"
                      min="0"
                      max={Math.max(
                        100000,
                        Math.max(base.free * 2, 0),
                        purchase,
                      )}
                      step="500"
                      value={purchase}
                      onChange={(e) => setPurchase(Number(e.target.value))}
                    />
                    <div className="quick-amounts">
                      {[5000, 15000, 30000, 50000].map((n) => (
                        <button
                          key={n}
                          className={purchase === n ? "chosen" : ""}
                          onClick={() => setPurchase(n)}
                        >
                          {m(n)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`simulation-result ${f.free < 0 ? "risk" : ""}`}
                  >
                    <span>
                      {f.free >= 0 ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}{" "}
                      {f.free >= 0
                        ? "There’s room in your plan."
                        : "This would stretch your plan."}
                    </span>
                    <strong>
                      {m(f.free)}{" "}
                      <small>
                        {f.free >= 0
                          ? "still free to spend"
                          : "below your planned needs"}
                      </small>
                    </strong>
                    <p>
                      {f.free >= 0
                        ? `Your bills, savings and buffer stay covered. That leaves about ${m(f.daily)} a day until payday.`
                        : `You’d need to find ${m(-f.free)} elsewhere or adjust what you’ve set aside.`}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        open({ type: "bill", amount: purchase });
                        setSimulate(false);
                      }}
                    >
                      Turn it into a plan <ArrowRight size={16} />
                    </button>
                  </div>
                  <span className="simulation-disclaimer">
                    An experiment only. Nothing is recorded until you save a
                    plan.
                  </span>
                </div>
              )}
            </div>
            <div className="bottom-panels">
              <section>
                <div className="subheading">
                  <h2>Life lately</h2>
                  <button onClick={() => go("activity")}>
                    All activity <ArrowUpRight size={15} />
                  </button>
                </div>
                {recent.length ? (
                  recent.slice(0, 3).map(transactionRow)
                ) : (
                  <div className="empty-mini">
                    Your story starts with the first transaction.
                    <button onClick={() => open({ type: "transaction" })}>
                      Add one <Plus size={15} />
                    </button>
                  </div>
                )}
              </section>
              <section>
                <div className="subheading">
                  <h2>Coming around the corner</h2>
                  <button onClick={() => go("plan")}>
                    Your plan <ArrowUpRight size={15} />
                  </button>
                </div>
                {upcoming.length ? (
                  upcoming.slice(0, 3).map((e) => (
                    <button
                      className="upcoming-mini"
                      key={e.id}
                      onClick={() => go("plan")}
                    >
                      <span className="date-tile">
                        <b>{new Date(e.date + "T12:00:00").getDate()}</b>
                        <small>
                          {new Date(e.date + "T12:00:00").toLocaleDateString(
                            "en-GB",
                            { month: "short" },
                          )}
                        </small>
                      </span>
                      <span>
                        <strong>{e.name}</strong>
                        <small>
                          {e.date < today
                            ? "Overdue · still reserved"
                            : `${dayDiff(today, e.date)} days away`}
                        </small>
                      </span>
                      <strong>{m(e.amount)}</strong>
                    </button>
                  ))
                ) : (
                  <div className="empty-mini">
                    No payments planned before payday.
                    <button onClick={() => open({ type: "bill" })}>
                      Plan an expense <Plus size={15} />
                    </button>
                  </div>
                )}
              </section>
            </div>
            <footer>
              <ShieldCheck size={13} /> Locally saved. No bank connection. No
              one looking over your shoulder.
              <button onClick={() => open({ type: "settings" })}>
                Back up your space <ArrowUpRight size={13} />
              </button>
            </footer>
          </section>
        )}
        {page === "activity" && (
          <section className="page-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE EVERYDAY STORY</span>
                <h1>Little things add up.</h1>
                <p>A clearer picture of where your money actually goes.</p>
              </div>
            </div>
            <div className="spending-summary">
              <div>
                <span className="label">Spent in the last 30 days</span>
                <strong>{m(spentTotal)}</strong>
                <small>Excludes savings transfers and debt repayments</small>
              </div>
              <div className="spending-composition">
                <div className="category-bar">
                  {categoryTotals.map((c) => (
                    <button
                      key={c.name}
                      title={`${c.name}: ${m(c.value)}`}
                      style={{ flex: c.value, background: c.color }}
                      onClick={() => setFilter(c.name)}
                      aria-label={`Filter ${c.name}`}
                    />
                  ))}
                </div>
                <div className="category-legend">
                  {categoryTotals.slice(0, 5).map((c) => (
                    <button key={c.name} onClick={() => setFilter(c.name)}>
                      <i style={{ background: c.color }} />
                      {c.name}
                      <b>{m(c.value)}</b>
                    </button>
                  ))}
                </div>
                {!spentTotal && (
                  <p>Add your first expense to see your spending take shape.</p>
                )}
              </div>
            </div>
            <div className="list-toolbar">
              <div className="search">
                <Search size={17} />
                <input
                  aria-label="Search transactions"
                  placeholder="Find a transaction…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="filter">
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Filter transactions"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option>All</option>
                  <option>Income</option>
                  <option>Savings</option>
                  <option>Debt payment</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="activity-list">
              {recent
                .filter(
                  (t) =>
                    (filter === "All" || t.category === filter) &&
                    `${t.name} ${t.category}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .map(transactionRow)}
              {!recent.some(
                (t) =>
                  (filter === "All" || t.category === filter) &&
                  `${t.name} ${t.category}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              ) && (
                <div className="empty-state">
                  <Search size={30} />
                  <h3>
                    {recent.length
                      ? "Nothing here just yet."
                      : "Your money has a story."}
                  </h3>
                  <p>
                    {recent.length
                      ? "Try another search or category."
                      : "Start with a purchase, a bill, or money coming in."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() =>
                      recent.length
                        ? (setQuery(""), setFilter("All"))
                        : open({ type: "transaction" })
                    }
                  >
                    {recent.length ? "Clear filters" : "Add a transaction"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
            <p className="quiet-note">
              Payments and transfers stay linked to your plan. Use the undo
              arrow to reverse a recorded payment and restore the linked bill,
              goal or debt. This only changes your records; it never moves money
              at your bank.
            </p>
          </section>
        )}
        {page === "plan" && (
          <section className="page-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  LESS SURPRISE. MORE POSSIBILITY.
                </span>
                <h1>Meet your future expenses.</h1>
                <p>Know what’s coming. Give it a place before it arrives.</p>
              </div>
              <button
                className="secondary"
                onClick={() => open({ type: "bill" })}
              >
                <Plus size={16} />
                Plan an expense
              </button>
            </div>
            <div className="plan-intro">
              <div>
                <span className="label">Reserved before payday</span>
                <strong>{m(base.bills)}</strong>
              </div>
              <p>
                {upcoming.length} scheduled payments, with{" "}
                {m(data.settings.dailyEssentials)} a day separately reserved for
                everyday living.{" "}
                <button
                  className="text-button"
                  onClick={() => open({ type: "settings" })}
                >
                  Adjust your plan <ArrowUpRight size={14} />
                </button>
              </p>
            </div>
            <div className="schedule">
              <div className="schedule-marker">
                <span />
                <div>
                  Today <small>{shortDate(today)}</small>
                </div>
              </div>
              {[
                ...data.bills.map((b) => ({ ...b, type: "bill" as const })),
                ...data.debts
                  .filter((d) => d.balance > 0)
                  .map((d) => ({
                    ...d,
                    amount: Math.min(d.payment, d.balance),
                    type: "debt" as const,
                  })),
              ]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((item) => (
                  <div
                    className={`schedule-row ${item.date < today ? "overdue" : ""}`}
                    key={item.id}
                  >
                    <div className="schedule-date">
                      <b>{new Date(item.date + "T12:00:00").getDate()}</b>
                      <span>
                        {new Date(item.date + "T12:00:00").toLocaleDateString(
                          "en-GB",
                          { month: "short" },
                        )}
                      </span>
                    </div>
                    <div className="schedule-info">
                      <h3>{item.name}</h3>
                      <span>
                        {item.date < today
                          ? "Overdue · still reserved"
                          : item.date >= data.settings.payday
                            ? "After next payday"
                            : dayDiff(today, item.date) === 0
                              ? "Due today"
                              : `In ${dayDiff(today, item.date)} days`}
                        {item.type === "debt" ? (
                          " · Debt repayment"
                        ) : item.recurring ? (
                          <>
                            <Repeat size={12} />
                            Monthly
                          </>
                        ) : (
                          " · One-off"
                        )}
                      </span>
                    </div>
                    <strong className="schedule-amount">
                      {m(item.amount)}
                    </strong>
                    <div className="schedule-actions">
                      <button
                        className="paid-button"
                        disabled={busy}
                        onClick={() =>
                          item.type === "bill" ? payBill(item) : payDebt(item)
                        }
                      >
                        <Check size={14} />
                        Mark paid
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${item.name}`}
                        onClick={() =>
                          open({
                            type: item.type,
                            item,
                            collection:
                              item.type === "bill" ? "bills" : "debts",
                          })
                        }
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              {!data.bills.length && !data.debts.length && (
                <div className="empty-state">
                  <CalendarDays size={32} />
                  <h3>A plan is a little peace of mind.</h3>
                  <p>
                    Add rent, subscriptions, upcoming trips, or anything else
                    you want to be ready for.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => open({ type: "bill" })}
                  >
                    <Plus size={16} />
                    Plan your first expense
                  </button>
                </div>
              )}
              <div className="payday-marker">
                <span className="payday-icon">
                  <ArrowDownLeft size={23} />
                </span>
                <div>
                  <strong>Next payday</strong>
                  <span>
                    {shortDate(data.settings.payday)} · Expected income, not yet
                    in your balance
                  </span>
                </div>
                <strong>{m(data.settings.income)}</strong>
                <button
                  className="icon-button"
                  aria-label="Edit payday"
                  onClick={() => open({ type: "settings" })}
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>
            <p className="quiet-note">
              Marking a payment paid records it in Activity and moves monthly
              payments to their next due date. It doesn’t move money at your
              bank. The timeline forecast includes payments strictly before your
              next payday.
            </p>
          </section>
        )}
        {page === "goals" && (
          <section className="page-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">LOOK AFTER FUTURE YOU</span>
                <h1>Good things take a little room.</h1>
                <p>Grow the things you want. Lighten the things you owe.</p>
              </div>
            </div>
            <div className="goal-section-heading">
              <h2>
                <Sprout size={20} />
                Things you’re growing
              </h2>
              <button
                className="text-button"
                onClick={() => open({ type: "goal" })}
              >
                New goal <Plus size={16} />
              </button>
            </div>
            <div className="savings-total">
              <strong>{m(data.goals.reduce((s, g) => s + g.saved, 0))}</strong>
              <span>
                already tucked away{" "}
                <small>Separate from your spending-account balance</small>
              </span>
            </div>
            <div className="goals-list">
              {data.goals.map((g, i) => {
                const progress = g.target
                  ? Math.min(100, (g.saved / g.target) * 100)
                  : 100;
                return (
                  <article className="goal-row" key={g.id}>
                    <div
                      className="goal-visual"
                      style={
                        {
                          "--goal-color": g.color,
                          "--progress": `${progress}%`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="goal-vessel">
                        <div className="goal-fill" />
                        <span>
                          {Math.round(progress)}
                          <small>%</small>
                        </span>
                      </div>
                      <span className="goal-number">0{i + 1}</span>
                    </div>
                    <div className="goal-content">
                      <div className="goal-title">
                        <h3>{g.name}</h3>
                        <button
                          className="icon-button"
                          aria-label={`Edit ${g.name}`}
                          onClick={() =>
                            open({ type: "goal", item: g, collection: "goals" })
                          }
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                      <div className="goal-amount">
                        <strong>{m(g.saved)}</strong>
                        <span>of {m(g.target)}</span>
                      </div>
                      <div className="progress-track">
                        <span
                          style={{ width: `${progress}%`, background: g.color }}
                        />
                      </div>
                      <p>
                        {g.saved >= g.target
                          ? "You made it. This one is yours."
                          : `${m(Math.max(0, g.target - g.saved))} to go. Every little bit counts.`}
                      </p>
                      <div className="goal-actions">
                        <span>
                          {m(
                            Math.min(
                              g.contribution,
                              Math.max(0, g.target - g.saved),
                            ),
                          )}{" "}
                          reserved this payday cycle
                        </span>
                        <button
                          className="text-button"
                          disabled={g.saved >= g.target}
                          onClick={() => open({ type: "fund", item: g })}
                        >
                          Add savings <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
              {!data.goals.length && (
                <div className="empty-state">
                  <Sprout size={32} />
                  <h3>What are you making room for?</h3>
                  <p>A rainy day, a big adventure, or a little more freedom.</p>
                  <button
                    className="secondary"
                    onClick={() => open({ type: "goal" })}
                  >
                    <Plus size={16} />
                    Make a savings goal
                  </button>
                </div>
              )}
            </div>
            <div className="goal-section-heading debt-heading">
              <h2>
                <TrendingDown size={20} />
                Things you’re paying down
              </h2>
              <button
                className="text-button"
                onClick={() => open({ type: "debt" })}
              >
                Add a debt <Plus size={16} />
              </button>
            </div>
            {data.debts.map((d) => {
              const months = payoff(d.balance, d.payment, d.apr);
              return (
                <article className="debt-row" key={d.id}>
                  <div className="debt-main">
                    <div>
                      <h3>{d.name}</h3>
                      <span>
                        {d.apr}% APR · {m(d.payment)} monthly payment
                      </span>
                    </div>
                    <strong>
                      {m(d.balance)}
                      <small>remaining</small>
                    </strong>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${d.name}`}
                      onClick={() =>
                        open({ type: "debt", item: d, collection: "debts" })
                      }
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                  <div className="debt-bottom">
                    <p>
                      {d.balance === 0
                        ? "One less thing on your mind. Paid off."
                        : months === null
                          ? "At this payment, estimated monthly interest is not covered."
                          : `About ${months} ${months === 1 ? "month" : "months"} to paid off at your current payment.`}
                      <small>
                        Estimate assumes a fixed APR, monthly compounding, no
                        new borrowing or fees.
                      </small>
                    </p>
                    {d.balance > 0 && (
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => payDebt(d)}
                      >
                        <Check size={15} />
                        Record {m(Math.min(d.payment, d.balance))} payment
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {!data.debts.length && (
              <div className="debt-empty">
                <CheckCircle2 size={20} />
                <p>No debts added. A little more breathing room.</p>
              </div>
            )}
            <p className="quiet-note">
              Debt payments reduce the recorded balance by the payment amount.
              Reconcile balances with your statements to include interest and
              fees. Savings contributions are one-off reservations for this
              payday cycle; replenish them when you plan the next cycle.
            </p>
          </section>
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <input
        type="file"
        accept="application/json,.json"
        ref={importRef}
        className="hidden"
        onChange={(e) => importData(e.target.files?.[0])}
      />
      {modal && (
        <Dialog
          title={
            modal.type === "transaction"
              ? modal.item
                ? "Edit transaction"
                : "A little money moment"
              : modal.type === "bill"
                ? modal.item
                  ? "Edit planned expense"
                  : "Make a little room"
                : modal.type === "goal"
                  ? modal.item
                    ? "Edit savings goal"
                    : "Something to look forward to"
                  : modal.type === "debt"
                    ? modal.item
                      ? "Edit debt"
                      : "A lighter future"
                    : modal.type === "settings"
                      ? "Your space, your rules"
                      : modal.type === "start"
                        ? "Let’s make this yours."
                        : modal.type === "fund"
                          ? "A little closer to your goal"
                          : modal.type === "delete"
                            ? "Remove this entry?"
                            : modal.type === "restore"
                              ? "Restore this space?"
                              : modal.type === "reverse"
                                ? "Undo this recorded payment?"
                                : "How much is really yours?"
          }
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {[
            "transaction",
            "bill",
            "goal",
            "debt",
            "settings",
            "start",
            "fund",
          ].includes(modal.type) && (
            <form onSubmit={submit}>
              {modal.type === "settings" || modal.type === "start" ? (
                <>
                  <p className="form-description">
                    {modal.type === "start"
                      ? "Start with the money you have today. All existing data in this space will be replaced when you save. Export a backup first if you want to keep it."
                      : "These are the assumptions behind your plan. Keep them close to real life."}
                  </p>
                  <div className="form-grid">
                    <Field label="Your first name">
                      <input
                        name="name"
                        defaultValue={
                          modal.type === "start" ? "" : data.settings.name
                        }
                        maxLength={80}
                        placeholder="What should we call you?"
                      />
                    </Field>
                    <Field
                      label="Currency"
                      hint="Changes the label; does not convert amounts."
                    >
                      <select
                        name="currency"
                        defaultValue={data.settings.currency}
                      >
                        {["GBP", "USD", "EUR", "INR", "CAD", "AUD"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field
                    label="Current spending-account balance"
                    hint="Total available cash in spending accounts. Exclude money already held in separate savings accounts."
                  >
                    <NumberInput
                      name="balance"
                      value={modal.type === "start" ? 0 : base.cash / 100}
                      min={-999999999}
                    />
                  </Field>
                  <div className="form-grid">
                    <Field label="Next payday">
                      <input
                        type="date"
                        name="payday"
                        min={addDays(today, 1)}
                        max={addDays(today, 365)}
                        required
                        defaultValue={
                          data.settings.payday > today
                            ? data.settings.payday
                            : addDays(today, 30)
                        }
                      />
                    </Field>
                    <Field label="Expected take-home pay">
                      <NumberInput
                        name="income"
                        value={
                          modal.type === "start"
                            ? 0
                            : data.settings.income / 100
                        }
                      />
                    </Field>
                    <Field
                      label="Everyday living / day"
                      hint="Groceries, transport, and usual essentials."
                    >
                      <NumberInput
                        name="dailyEssentials"
                        value={
                          modal.type === "start"
                            ? 0
                            : data.settings.dailyEssentials / 100
                        }
                      />
                    </Field>
                    <Field
                      label="Safety buffer"
                      hint="Cash you want to leave untouched."
                    >
                      <NumberInput
                        name="buffer"
                        value={
                          modal.type === "start"
                            ? 0
                            : data.settings.buffer / 100
                        }
                      />
                    </Field>
                  </div>
                  <p className="form-note">
                    <ShieldCheck size={16} />
                    Everything is saved in IndexedDB in this browser. Clearing
                    site data removes it. Export a backup to keep a copy.
                  </p>
                </>
              ) : modal.type === "fund" ? (
                <>
                  <p className="form-description">
                    Record money moved from your spending account to{" "}
                    <b>{modal.item?.name}</b>. Your available cash will
                    decrease, and your goal will grow.
                  </p>
                  <Field label={`Amount to save (${currency})`}>
                    <NumberInput
                      name="amount"
                      value={
                        Math.min(
                          (modal.item as Goal).contribution,
                          Math.max(
                            0,
                            (modal.item as Goal).target -
                              (modal.item as Goal).saved,
                          ),
                        ) / 100
                      }
                      min={0.01}
                      max={
                        Math.max(
                          0,
                          (modal.item as Goal).target -
                            (modal.item as Goal).saved,
                        ) / 100
                      }
                    />
                  </Field>
                  <p className="form-note">
                    This records a transfer you make yourself. It does not
                    connect to or move money at your bank.
                  </p>
                </>
              ) : (
                <>
                  <Field
                    label={
                      modal.type === "transaction"
                        ? "What was it for?"
                        : modal.type === "bill"
                          ? "What are you planning?"
                          : modal.type === "goal"
                            ? "What are you saving for?"
                            : "Debt name"
                    }
                  >
                    <input
                      autoFocus
                      name="name"
                      required
                      maxLength={100}
                      defaultValue={modal.item?.name ?? ""}
                      placeholder={
                        modal.type === "transaction"
                          ? "Coffee, groceries, payday…"
                          : modal.type === "bill"
                            ? "Rent, a trip, an annual renewal…"
                            : modal.type === "goal"
                              ? "A rainy day, or somewhere sunny…"
                              : "Credit card, personal loan…"
                      }
                    />
                  </Field>
                  {modal.type === "transaction" && (
                    <Field label="Money direction">
                      <select
                        name="kind"
                        defaultValue={
                          (modal.item as Transaction)?.kind ?? "expense"
                        }
                      >
                        <option value="expense">Money out</option>
                        <option value="income">Money in</option>
                      </select>
                    </Field>
                  )}
                  <div className="form-grid">
                    <Field
                      label={`${modal.type === "goal" ? "Target" : modal.type === "debt" ? "Current balance" : "Amount"} (${currency})`}
                    >
                      <NumberInput
                        name="amount"
                        value={
                          modal.amount !== undefined
                            ? modal.amount / 100
                            : modal.item
                              ? ("amount" in modal.item
                                  ? modal.item.amount
                                  : "target" in modal.item
                                    ? modal.item.target
                                    : "balance" in modal.item
                                      ? modal.item.balance
                                      : 0) / 100
                              : 0
                        }
                        min={modal.type === "debt" ? 0 : 0.01}
                      />
                    </Field>
                    {(modal.type === "transaction" ||
                      modal.type === "bill" ||
                      modal.type === "debt") && (
                      <Field
                        label={
                          modal.type === "transaction"
                            ? "Date"
                            : modal.type === "debt"
                              ? "Next payment date"
                              : "Due date"
                        }
                      >
                        <input
                          type="date"
                          name="date"
                          required
                          defaultValue={
                            (modal.item as Transaction | Bill | Debt)?.date ??
                            today
                          }
                          max={modal.type === "transaction" ? today : undefined}
                        />
                      </Field>
                    )}
                    {(modal.type === "transaction" ||
                      modal.type === "bill") && (
                      <Field label="Category">
                        <select
                          name="category"
                          defaultValue={
                            categories.includes(
                              (modal.item as Transaction)?.category,
                            )
                              ? (modal.item as Transaction).category
                              : "Other"
                          }
                        >
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    )}
                    {modal.type === "goal" && (
                      <>
                        <Field
                          label="Already saved"
                          hint="Held separately from your spending account."
                        >
                          <NumberInput
                            name="saved"
                            value={(modal.item as Goal)?.saved / 100 || 0}
                          />
                        </Field>
                        <Field
                          label="Set aside before payday"
                          hint="Reserved now; record a transfer when you save it."
                        >
                          <NumberInput
                            name="contribution"
                            value={
                              (modal.item as Goal)?.contribution / 100 || 0
                            }
                          />
                        </Field>
                      </>
                    )}
                    {modal.type === "debt" && (
                      <>
                        <Field label="Interest rate (APR %)">
                          <NumberInput
                            name="apr"
                            value={(modal.item as Debt)?.apr ?? 0}
                            max={100}
                          />
                        </Field>
                        <Field label="Monthly payment">
                          <NumberInput
                            name="payment"
                            value={(modal.item as Debt)?.payment / 100 || 0}
                            min={0.01}
                          />
                        </Field>
                      </>
                    )}
                  </div>
                  {modal.type === "bill" && (
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        name="recurring"
                        defaultChecked={
                          (modal.item as Bill)?.recurring ?? false
                        }
                      />
                      <span>Repeat every month</span>
                      <Repeat size={15} />
                    </label>
                  )}
                  {modal.type === "transaction" && !modal.item && (
                    <p className="form-note">
                      Your current balance will{" "}
                      {
                        <span>
                          change by this amount. For an expense already in your
                          plan, use “Mark paid” there to avoid counting it
                          twice.
                        </span>
                      }
                    </p>
                  )}
                  {modal.type === "goal" && (
                    <p className="form-note">
                      Editing “already saved” reconciles your goal balance
                      without changing cash. Use “Add savings” to record a
                      transfer from your spending account.
                    </p>
                  )}
                </>
              )}
              <div className="form-actions">
                {modal.item && modal.type !== "fund" && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => open({ ...modal, type: "delete" })}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setModal(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button className="primary" type="submit" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal.type === "start"
                      ? "Create my space"
                      : modal.type === "fund"
                        ? "Record savings"
                        : "Save changes"}
                  <Check size={16} />
                </button>
              </div>
              {modal.type === "settings" && (
                <div className="data-settings">
                  <span className="eyebrow">YOUR DATA BELONGS TO YOU</span>
                  <div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={exportData}
                    >
                      <Download size={16} />
                      Export backup
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => importRef.current?.click()}
                    >
                      <Upload size={16} />
                      Import backup
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => open({ type: "start" })}
                  >
                    {data.demo ? "Replace example data" : "Start a fresh space"}{" "}
                    <ArrowRight size={14} />
                  </button>
                  {!data.demo && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => open({ type: "restore", data: seed() })}
                    >
                      Explore example data <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </form>
          )}
          {modal.type === "explain" && (
            <>
              <p className="form-description">
                A plan built from what you have, through the day before your
                next payday. Future income is never counted as money you can
                spend now.
              </p>
              <div className="math-list">
                <div>
                  <span>Current spending-account balance</span>
                  <strong>{m(base.cash, true)}</strong>
                </div>
                {[
                  ["Scheduled bills & debt payments", base.bills],
                  ["Everyday living", base.essentials],
                  ["Planned savings", base.savings],
                  ["Your safety buffer", base.buffer],
                ].map(([label, amount]) => (
                  <div key={String(label)}>
                    <span>{label}</span>
                    <strong>− {m(Number(amount), true)}</strong>
                  </div>
                ))}
                <div className="math-total">
                  <span>Free to spend</span>
                  <strong>{m(base.free, true)}</strong>
                </div>
              </div>
              <p className="form-note">
                Based on the entries and estimates you provide. Timeline
                previews subtract scheduled payments and estimated everyday
                living as the days pass; your reserved spending money stays
                available. Debt interest and unrecorded purchases are not
                automatically added.
              </p>
              <button
                className="primary full-width"
                onClick={() => setModal(null)}
              >
                That makes sense <Check size={16} />
              </button>
            </>
          )}
          {modal.type === "delete" && (
            <>
              <p className="form-description">
                Remove <b>{modal.item?.name}</b>?{" "}
                {modal.collection === "transactions"
                  ? "Your account balance will be recalculated."
                  : "Its reservation will be removed from your plan. Existing activity records will stay."}
              </p>
              <div className="form-actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Keep it
                </button>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() =>
                    save(
                      (d) => ({
                        ...d,
                        [modal.collection!]: d[modal.collection!].filter(
                          (x) => x.id !== modal.item?.id,
                        ),
                      }),
                      "Entry removed",
                    )
                  }
                >
                  Remove entry
                </button>
              </div>
            </>
          )}
          {modal.type === "reverse" && (
            <>
              <p className="form-description">
                Undo <b>{modal.item?.name}</b>? The money will return to your
                recorded spending balance, and the linked plan will be restored.
                This does not reverse a real bank transfer.
              </p>
              <div className="form-actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Keep it
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => reverseTransaction(modal.item as Transaction)}
                >
                  Undo payment <RotateCcw size={16} />
                </button>
              </div>
            </>
          )}
          {modal.type === "restore" && (
            <>
              <p className="form-description">
                This will replace all the information in this browser with{" "}
                {modal.data?.demo ? "example finances" : "the selected backup"}.
                Export your current space first if you want to keep it.
              </p>
              <div className="restore-summary">
                <span>{modal.data?.transactions.length} transactions</span>
                <span>{modal.data?.bills.length} planned expenses</span>
                <span>{modal.data?.goals.length} goals</span>
              </div>
              <button className="text-button" onClick={exportData}>
                <Download size={15} />
                Export current space first
              </button>
              <div className="form-actions">
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await save(
                        () => modal.data!,
                        "Your space has been restored",
                      )
                    ) {
                      setOffset(0);
                      setSimulate(false);
                      go("money");
                    }
                  }}
                >
                  Replace & restore
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}
export default App;
