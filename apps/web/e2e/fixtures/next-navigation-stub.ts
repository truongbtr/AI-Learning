/** Enough of next/navigation for a component rendered outside Next (the parent bench). */
export function useRouter() {
  return {
    refresh: () => {},
    push: () => {},
    replace: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  };
}
export function usePathname() {
  return "/parent/diary";
}
export function useSearchParams() {
  return new URLSearchParams();
}
