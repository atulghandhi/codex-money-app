import test from "node:test";
import assert from "node:assert/strict";
import {
  blank,
  finance,
  events,
  addDays,
  nextMonth,
  payoff,
  validateData,
  seed,
} from "../src/model.ts";
const today = "2026-09-26";
function fixture() {
  const d = blank();
  d.settings = {
    ...d.settings,
    openingBalance: 100000,
    payday: "2026-10-06",
    dailyEssentials: 1000,
    buffer: 10000,
  };
  return d;
}
test("reserves bills, living costs, goals, buffer and debt without using expected income", () => {
  const d = fixture();
  d.settings.income = 900000;
  d.bills = [
    {
      id: "b",
      name: "rent",
      amount: 20000,
      date: "2026-10-01",
      recurring: false,
      category: "Home",
    },
  ];
  d.debts = [
    {
      id: "d",
      name: "loan",
      balance: 30000,
      payment: 5000,
      apr: 0,
      date: "2026-10-02",
    },
  ];
  d.goals = [
    {
      id: "g",
      name: "trip",
      target: 50000,
      saved: 10000,
      contribution: 10000,
      color: "#aabbcc",
    },
  ];
  assert.equal(finance(d, 0, 0, today).free, 45000);
});
test("forecast reduces cash and fulfilled reservations together", () => {
  const d = fixture();
  d.bills = [
    {
      id: "b",
      name: "rent",
      amount: 20000,
      date: "2026-09-28",
      recurring: false,
      category: "Home",
    },
  ];
  const a = finance(d, 0, 0, today),
    b = finance(d, 4, 0, today);
  assert.equal(a.free, b.free);
  assert.equal(b.balance, 76000);
  assert.equal(b.bills, 0);
  assert.equal(b.essentials, 6000);
});
test("purchase simulation reveals shortfall and does not modify records", () => {
  const d = fixture();
  const before = JSON.stringify(d);
  assert.equal(finance(d, 0, 90000, today).free, -10000);
  assert.equal(JSON.stringify(d), before);
});
test("bills on payday are excluded, overdue bills stay reserved", () => {
  const d = fixture();
  d.bills = [
    {
      id: "old",
      name: "old",
      amount: 4000,
      date: "2026-09-25",
      recurring: false,
      category: "Bills",
    },
    {
      id: "next",
      name: "next",
      amount: 9000,
      date: "2026-10-06",
      recurring: false,
      category: "Bills",
    },
  ];
  assert.equal(events(d, today).length, 1);
  assert.equal(finance(d, 0, 0, today).bills, 4000);
});
test("recurring payments repeat through the planning horizon", () => {
  const d = fixture();
  d.settings.payday = "2026-12-01";
  d.bills = [
    {
      id: "b",
      name: "rent",
      amount: 10000,
      date: "2026-10-01",
      recurring: true,
      category: "Home",
    },
  ];
  assert.equal(finance(d, 0, 0, today).bills, 20000);
});
test("month ends clamp, date arithmetic crosses DST", () => {
  assert.equal(nextMonth("2026-01-31"), "2026-02-28");
  assert.equal(nextMonth("2028-01-31"), "2028-02-29");
  assert.equal(addDays("2026-10-24", 2), "2026-10-26");
});
test("goal reservation never exceeds remaining target", () => {
  const d = fixture();
  d.goals = [
    {
      id: "g",
      name: "goal",
      target: 10000,
      saved: 9000,
      contribution: 5000,
      color: "#aabbcc",
    },
  ];
  assert.equal(finance(d, 0, 0, today).savings, 1000);
});
test("income increases and transfers decrease available cash", () => {
  const d = fixture();
  d.transactions = [
    {
      id: "1",
      name: "pay",
      kind: "income",
      amount: 10000,
      date: today,
      category: "Income",
    },
    {
      id: "2",
      name: "save",
      kind: "transfer",
      amount: 3000,
      date: today,
      category: "Savings",
    },
  ];
  assert.equal(finance(d, 0, 0, today).cash, 107000);
});
test("payoff handles zero APR, completed and non-amortizing balances", () => {
  assert.equal(payoff(10000, 1000, 0), 10);
  assert.equal(payoff(0, 1000, 20), 0);
  assert.equal(payoff(100000, 1000, 24), null);
  assert.equal(payoff(100000, 10000, 12), 11);
});
test("backups validate currencies, amounts, dates, IDs and structures", () => {
  const d = seed();
  assert.ok(validateData(d));
  assert.ok(!validateData({ ...d, version: 2 }));
  assert.ok(
    !validateData({ ...d, settings: { ...d.settings, currency: "XYZ" } }),
  );
  assert.ok(
    !validateData({
      ...d,
      transactions: [{ ...d.transactions[0], amount: -1 }],
    }),
  );
  assert.ok(
    !validateData({ ...d, bills: [{ ...d.bills[0], date: "2026-02-31" }] }),
  );
  assert.ok(
    !validateData({ ...d, goals: [{ ...d.goals[0], color: "url(evil)" }] }),
  );
  assert.ok(
    !validateData({
      ...d,
      transactions: [d.transactions[0], d.transactions[0]],
    }),
  );
});
