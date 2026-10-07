"use client"

import type { Ref } from "react"
import {
  Cell,
  Column,
  Row,
  Table as AriaTable,
  TableBody,
  TableHeader,
} from "react-aria-components"
import type { TableProps as AriaTableProps } from "react-aria-components"
import { cx } from "@/utils/cx"

/**
 * Table primitive — built on react-aria-components `Table` for semantic markup,
 * keyboard navigation, row selection and sortable columns.
 *
 * React Aria's `Column`, `Row`, `Cell`, `TableHeader` and `TableBody` are
 * *collection* components: React Aria introspects them at build time, so they
 * can't be wrapped in custom components without losing that behaviour. We
 * therefore re-export them as-is and apply BoardUI styling through scoped CSS
 * keyed on `.bui-table` (see styles/globals.css). Only the root `<Table>` is
 * wrapped — to add the scroll container and the size flag.
 *
 * Sizes: `md` (h-16 rows) and `sm` (h-12 rows), set once via `data-size`.
 *
 * Pair with @tanstack/react-table when you need sorting / filtering /
 * pagination logic (see the advanced Data Table example).
 */

export type TableSize = "sm" | "md"

export interface TableProps extends Omit<AriaTableProps, "className"> {
  size?: TableSize
  className?: string
  /** Class for the scroll container that wraps the table. */
  containerClassName?: string
  ref?: Ref<HTMLTableElement>
}

export function Table({
  size = "md",
  className,
  containerClassName,
  ref,
  ...props
}: TableProps) {
  return (
    <div className={cx("w-full overflow-x-auto", containerClassName)}>
      <AriaTable
        ref={ref}
        {...props}
        className={cx("bui-table", size === "sm" && "bui-table-sm", className)}
      />
    </div>
  )
}

export {
  TableHeader,
  Column as TableColumn,
  TableBody,
  Row as TableRow,
  Cell as TableCell,
}
