import "fake-indexeddb/auto";
import test from "node:test";
import assert from "node:assert/strict";
import { read, change } from "../src/db.ts";
import { blank, finance } from "../src/model.ts";
test("IndexedDB retains writes, serializes simultaneous mutations and rejects invalid state atomically", async () => {
  const initial = await read();
  assert.equal(initial.version, 1);
  await change(() => blank());
  const one = await change((d) => ({
    ...d,
    settings: { ...d.settings, openingBalance: 50000 },
  }));
  assert.equal(finance(one).cash, 50000);
  assert.equal((await read()).settings.openingBalance, 50000);
  await Promise.all(
    Array.from({ length: 10 }, () =>
      change((d) => ({
        ...d,
        settings: {
          ...d.settings,
          openingBalance: d.settings.openingBalance + 100,
        },
      })),
    ),
  );
  assert.equal((await read()).settings.openingBalance, 51000);
  await assert.rejects(
    change((d) => ({ ...d, settings: { ...d.settings, currency: "INVALID" } })),
  );
  assert.equal((await read()).settings.currency, "GBP");
  assert.equal((await read()).settings.openingBalance, 51000);
  await assert.rejects(
    change(() => {
      throw new Error("Simulated operation failure");
    }),
  );
  assert.equal((await read()).settings.openingBalance, 51000);
});
