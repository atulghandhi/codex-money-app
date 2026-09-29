import { seed, validateData, type Data } from "./model";
let connection: Promise<IDBDatabase> | undefined;
function open() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("pocketroom", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("state");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () =>
      reject(new Error("Close other Pocketroom tabs and try again."));
  }));
}
export async function read(): Promise<Data> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction("state", "readwrite");
    const s = t.objectStore("state");
    const r = s.get("finance");
    let data: Data;
    r.onsuccess = () => {
      data = r.result ?? seed();
      if (!validateData(data)) {
        t.abort();
        return;
      }
      if (!r.result) s.put(data, "finance");
    };
    t.oncomplete = () => resolve(data);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(new Error("Your saved data could not be read."));
  });
}
export async function change(update: (old: Data) => Data): Promise<Data> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction("state", "readwrite");
    const s = t.objectStore("state");
    const r = s.get("finance");
    let result: Data;
    let error: unknown;
    r.onsuccess = () => {
      try {
        result = update(r.result);
        if (!validateData(result))
          throw new Error(
            "Some values are invalid. Please check your entries.",
          );
        s.put(result, "finance");
      } catch (e) {
        error = e;
        t.abort();
      }
    };
    t.oncomplete = () => resolve(result);
    t.onabort = () =>
      reject(error ?? t.error ?? new Error("Could not save your change."));
    t.onerror = () => reject(t.error);
  });
}
