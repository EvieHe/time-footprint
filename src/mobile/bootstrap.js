/** Mobile-only initialization. Electron retains its IPC-backed activityAPI. */
export async function bootstrapNativeActivity() {
  const [{ CapacitorSQLite, SQLiteConnection }, { App }] = await Promise.all([
    import('@capacitor-community/sqlite'), import('@capacitor/app'),
  ]);
  const { createActivityStore } = await import('./activity-store.js');
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const name = 'time_footprint';
  const existing = await sqlite.isConnection(name, false);
  const db = existing.result
    ? await sqlite.retrieveConnection(name, false)
    : await sqlite.createConnection(name, false, 'no-encryption', 1, false);
  await db.open();
  const store = createActivityStore(db);
  await store.init();
  const listeners = new Set();
  let backgroundAt = null;
  await App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) { backgroundAt = Date.now(); return; }
    const elapsed = backgroundAt === null ? 0 : Date.now() - backgroundAt;
    backgroundAt = null;
    for (const cb of listeners) cb({ elapsed });
  });
  return {
    ...store,
    onResume(callback) { listeners.add(callback); return () => listeners.delete(callback); },
  };
}
