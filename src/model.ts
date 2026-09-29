export type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  kind: "expense" | "income" | "transfer";
  linkId?: string;
  reversal?:
    | { kind: "bill"; bill: Bill }
    | { kind: "goal"; reserveUsed: number }
    | { kind: "debt"; previousDate: string };
};
export type Bill = {
  id: string;
  name: string;
  amount: number;
  date: string;
  recurring: boolean;
  category: string;
};
export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  contribution: number;
  color: string;
};
export type Debt = {
  id: string;
  name: string;
  balance: number;
  apr: number;
  payment: number;
  date: string;
};
export type Data = {
  version: 1;
  demo: boolean;
  settings: {
    name: string;
    currency: string;
    openingBalance: number;
    payday: string;
    income: number;
    dailyEssentials: number;
    buffer: number;
  };
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
  debts: Debt[];
};
export const uid = () => crypto.randomUUID();
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (date: string, n: number) => {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
};
export const dayDiff = (a: string, b: string) =>
  Math.round(
    (Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000,
  );
export const nextMonth = (date: string) => {
  const d = new Date(date + "T12:00:00");
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return dateKey(d);
};
export const money = (value: number, currency = "GBP", decimals = false) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: decimals ? 2 : 0,
  }).format(value / 100);
export const shortDate = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
export const cents = (s: FormDataEntryValue | null) =>
  Math.round(Number(s || 0) * 100);
export function seed(): Data {
  const today = dateKey();
  return {
    version: 1,
    demo: true,
    settings: {
      name: "Alex",
      currency: "GBP",
      openingBalance: 423869,
      payday: addDays(today, 24),
      income: 320000,
      dailyEssentials: 1400,
      buffer: 20000,
    },
    transactions: [
      {
        id: uid(),
        name: "Whole Foods Market",
        amount: 6240,
        date: today,
        category: "Groceries",
        kind: "expense",
      },
      {
        id: uid(),
        name: "Sunday coffee",
        amount: 480,
        date: today,
        category: "Eating out",
        kind: "expense",
      },
      {
        id: uid(),
        name: "Transport for London",
        amount: 860,
        date: addDays(today, -1),
        category: "Transport",
        kind: "expense",
      },
      {
        id: uid(),
        name: "Dinner with friends",
        amount: 4250,
        date: addDays(today, -2),
        category: "Eating out",
        kind: "expense",
      },
      {
        id: uid(),
        name: "A little freelance work",
        amount: 18000,
        date: addDays(today, -3),
        category: "Income",
        kind: "income",
      },
      {
        id: uid(),
        name: "Weekly food shop",
        amount: 7940,
        date: addDays(today, -4),
        category: "Groceries",
        kind: "expense",
      },
      {
        id: uid(),
        name: "New running shoes",
        amount: 8900,
        date: addDays(today, -5),
        category: "Shopping",
        kind: "expense",
      },
      {
        id: uid(),
        name: "Last month’s rent",
        amount: 125000,
        date: addDays(today, -27),
        category: "Home",
        kind: "expense",
      },
    ],
    bills: [
      {
        id: uid(),
        name: "Rent",
        amount: 105000,
        date: addDays(today, 5),
        recurring: true,
        category: "Home",
      },
      {
        id: uid(),
        name: "Electricity & water",
        amount: 9200,
        date: addDays(today, 8),
        recurring: true,
        category: "Bills",
      },
      {
        id: uid(),
        name: "Spotify",
        amount: 1199,
        date: addDays(today, 11),
        recurring: true,
        category: "Subscriptions",
      },
      {
        id: uid(),
        name: "Internet",
        amount: 3200,
        date: addDays(today, 13),
        recurring: true,
        category: "Bills",
      },
      {
        id: uid(),
        name: "Weekend in Brighton",
        amount: 12000,
        date: addDays(today, 17),
        recurring: false,
        category: "Travel",
      },
    ],
    goals: [
      {
        id: uid(),
        name: "Japan, someday soon",
        target: 300000,
        saved: 185000,
        contribution: 15000,
        color: "#b9acd9",
      },
      {
        id: uid(),
        name: "Rainy-day fund",
        target: 500000,
        saved: 320000,
        contribution: 10000,
        color: "#9dc2b5",
      },
    ],
    debts: [
      {
        id: uid(),
        name: "Credit card",
        balance: 124000,
        apr: 19.9,
        payment: 10000,
        date: addDays(today, 15),
      },
    ],
  };
}
export function blank(): Data {
  const d = seed();
  return {
    ...d,
    demo: false,
    settings: {
      ...d.settings,
      name: "",
      openingBalance: 0,
      dailyEssentials: 0,
      buffer: 0,
      income: 0,
      payday: addDays(dateKey(), 30),
    },
    transactions: [],
    bills: [],
    goals: [],
    debts: [],
  };
}
export type Event = {
  id: string;
  name: string;
  date: string;
  amount: number;
  type: "bill" | "debt";
  sourceId: string;
};
export function events(data: Data, today = dateKey()): Event[] {
  const result: Event[] = [];
  const until = data.settings.payday;
  for (const b of data.bills) {
    let date = b.date;
    let i = 0;
    while (date < until && i < 120) {
      result.push({
        id: `${b.id}-${date}`,
        name: b.name,
        date,
        amount: b.amount,
        type: "bill",
        sourceId: b.id,
      });
      if (!b.recurring) break;
      date = nextMonth(date);
      i++;
    }
  }
  for (const d of data.debts) {
    let date = d.date;
    let remaining = d.balance;
    let i = 0;
    while (date < until && remaining > 0 && i < 120) {
      const amount = Math.min(d.payment, remaining);
      result.push({
        id: `${d.id}-${date}`,
        name: d.name,
        date,
        amount,
        type: "debt",
        sourceId: d.id,
      });
      remaining -= amount;
      date = nextMonth(date);
      i++;
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
export function finance(
  data: Data,
  offset = 0,
  purchase = 0,
  today = dateKey(),
) {
  const days = Math.max(0, dayDiff(today, data.settings.payday));
  const day = Math.min(offset, Math.max(0, days - 1));
  const at = addDays(today, day);
  const cash =
    data.settings.openingBalance +
    data.transactions.reduce(
      (s, t) => s + (t.kind === "income" ? t.amount : -t.amount),
      0,
    );
  const list = events(data, today);
  const paid =
    offset === 0
      ? 0
      : list.filter((e) => e.date < at).reduce((s, e) => s + e.amount, 0);
  const bills = list.reduce((s, e) => s + e.amount, 0) - paid;
  const essentials = Math.max(0, days - day) * data.settings.dailyEssentials;
  const savings = data.goals.reduce(
    (s, g) => s + Math.min(g.contribution, Math.max(0, g.target - g.saved)),
    0,
  );
  const balance = cash - paid - day * data.settings.dailyEssentials - purchase;
  const free = balance - bills - essentials - savings - data.settings.buffer;
  return {
    cash,
    balance,
    bills,
    essentials,
    savings,
    free,
    days,
    day,
    at,
    list,
    buffer: data.settings.buffer,
    daily: days > 0 ? Math.floor(free / days) : 0,
  };
}
export function payoff(balance: number, payment: number, apr: number) {
  const rate = apr / 1200;
  if (balance <= 0) return 0;
  if (payment <= balance * rate || payment <= 0) return null;
  return rate === 0
    ? Math.ceil(balance / payment)
    : Math.ceil(-Math.log(1 - (balance * rate) / payment) / Math.log(1 + rate));
}
export function validateData(v: unknown): v is Data {
  if (!v || typeof v !== "object") return false;
  const d = v as Data;
  const num = (n: unknown) =>
    typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n < 1e12;
  const str = (s: unknown) => typeof s === "string" && s.length <= 160;
  const dt = (s: unknown) =>
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(Date.parse(s)) &&
    dateKey(new Date(s + "T12:00:00")) === s;
  if (
    d.version !== 1 ||
    typeof d.demo !== "boolean" ||
    !d.settings ||
    !["GBP", "USD", "EUR", "INR", "CAD", "AUD"].includes(d.settings.currency) ||
    !str(d.settings.name) ||
    !Number.isSafeInteger(d.settings.openingBalance) ||
    Math.abs(d.settings.openingBalance) >= 1e12 ||
    !dt(d.settings.payday) ||
    !num(d.settings.income) ||
    !num(d.settings.dailyEssentials) ||
    !num(d.settings.buffer)
  )
    return false;
  if (
    ![d.transactions, d.bills, d.goals, d.debts].every(
      (a) => Array.isArray(a) && a.length <= 100000,
    )
  )
    return false;
  const base = (x: { id: string; name: string }) =>
    x && str(x.id) && str(x.name);
  const validBill = (b: Bill) =>
    base(b) &&
    num(b.amount) &&
    dt(b.date) &&
    typeof b.recurring === "boolean" &&
    str(b.category);
  const reversal = (t: Transaction) =>
    !t.reversal ||
    (!!t.linkId &&
      (t.reversal.kind === "bill"
        ? validBill(t.reversal.bill)
        : t.reversal.kind === "goal"
          ? num(t.reversal.reserveUsed)
          : t.reversal.kind === "debt"
            ? dt(t.reversal.previousDate)
            : false));
  return (
    d.transactions.every(
      (t) =>
        base(t) &&
        reversal(t) &&
        num(t.amount) &&
        dt(t.date) &&
        str(t.category) &&
        ["income", "expense", "transfer"].includes(t.kind) &&
        (t.linkId === undefined || str(t.linkId)),
    ) &&
    d.bills.every(
      (b) =>
        base(b) &&
        num(b.amount) &&
        dt(b.date) &&
        typeof b.recurring === "boolean" &&
        str(b.category),
    ) &&
    d.goals.every(
      (g) =>
        base(g) &&
        num(g.target) &&
        num(g.saved) &&
        num(g.contribution) &&
        /^#[0-9a-fA-F]{6}$/.test(g.color),
    ) &&
    d.debts.every(
      (t) =>
        base(t) &&
        num(t.balance) &&
        num(t.payment) &&
        typeof t.apr === "number" &&
        isFinite(t.apr) &&
        t.apr >= 0 &&
        t.apr <= 100 &&
        dt(t.date),
    ) &&
    [d.transactions, d.bills, d.goals, d.debts].every(
      (a) => new Set(a.map((x) => x.id)).size === a.length,
    )
  );
}
