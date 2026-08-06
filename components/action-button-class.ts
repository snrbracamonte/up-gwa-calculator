// Shared style for "Add course" / "Add GWA" / "Add semester" style action
// buttons: a fixed, consistent width so none of them stretch to fill their
// row — they sit left-aligned, same size, whether alone or paired. Borderless
// by design — a subtle background tint gives them definition instead.
export const ACTION_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 min-w-[14rem] rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-secondary/70'
