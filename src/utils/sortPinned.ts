export function sortPinned<T extends { pinned?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
}
