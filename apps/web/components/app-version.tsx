/**
 * The build's version, small at the bottom of every screen (owner, 17/09/2026), so a screenshot
 * says which release it came from. Decoration, not content: it never takes a tap and is hidden
 * from screen readers, so the kid screens' "everything is read aloud" rule does not reach it.
 */
export function AppVersion() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  if (!version) return null;
  return (
    <div
      aria-hidden
      data-testid="app-version"
      className="pointer-events-none fixed inset-x-0 bottom-[max(2px,env(safe-area-inset-bottom))] z-[100] select-none text-center font-medium text-[10px] text-slate-500/70 leading-none"
    >
      v{version}
    </div>
  );
}
