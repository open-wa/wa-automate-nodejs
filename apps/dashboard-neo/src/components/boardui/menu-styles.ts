// BoardUI registry source (MIT). Pinned source and adaptations: ./README.md.
/**
 * Shared visual recipe for BoardUI menu surfaces.
 *
 * Select and Dropdown intentionally keep their distinct React Aria semantics
 * (single-value listbox vs. action menu), while consuming the same panel,
 * motion, and row treatments from here.
 */
export const MENU_POPOVER_SURFACE = [
  "max-w-[calc(100vw-32px)] overflow-y-auto",
  "rounded-2xl border border-border-button-default bg-background-primary-default p-2.5 shadow-dropdown",
  "transition duration-150 ease-out",
  "data-[entering]:opacity-0 data-[entering]:scale-95 data-[entering]:blur-[2px]",
  "data-[exiting]:opacity-0 data-[exiting]:scale-95 data-[exiting]:blur-[2px]",
  "data-[placement=bottom]:origin-top-left rtl:data-[placement=bottom]:origin-top-right data-[placement=top]:origin-bottom-left rtl:data-[placement=top]:origin-bottom-right",
  "data-[placement=left]:origin-right data-[placement=right]:origin-left",
].join(" ");

export const MENU_POPOVER_WIDTH = "w-[266px]";

export const MENU_ITEMS_CONTAINER = "flex w-full flex-col gap-1 outline-none";

export const MENU_ITEM = [
  "flex w-full cursor-pointer items-center gap-2 rounded-2lg p-2 text-start",
  "text-text-primary outline-none transition-colors",
].join(" ");

export const MENU_ITEM_ACTIVE = "bg-dropdown-item-hover-background";

export const MENU_ITEM_INTERACTIVE =
  "hover:bg-dropdown-item-hover-background focus-visible:bg-dropdown-item-hover-background";
