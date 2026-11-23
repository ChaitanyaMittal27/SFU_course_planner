import type { ReactNode } from "react";
import { cardTable } from "@/components/course/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bodyStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

export interface ComparisonColumn {
  key: string;
  header: ReactNode;
  /** Plain label repeated beside mobile values, without duplicating header links. */
  mobileLabel: string;
}

export interface ComparisonRowData {
  label: string;
  /** One cell per column, in column order. */
  cells: ReactNode[];
}

/**
 * Side-by-side comparison used by Compare courses and Compare sections: one column
 * per compared item (th scope="col"), one row per measure (th scope="row"), an empty
 * corner cell. Meant to sit edge to edge inside a SectionCard.
 */
export default function ComparisonTable({ columns, rows, className }: { columns: ComparisonColumn[]; rows: ComparisonRowData[]; className?: string }) {
  return (
    <Table className={cn("block sm:table sm:table-fixed", className)}>
      <TableHeader className="sr-only focus-within:not-sr-only sm:not-sr-only sm:table-header-group">
        <TableRow className={cardTable.headRow}>
          <TableHead className={cn(cardTable.head, "w-40")}>
            <span className="sr-only">Measure</span>
          </TableHead>
          {columns.map((column) => (
            <TableHead key={column.key} scope="col" className={cn(cardTable.head, "whitespace-normal align-top text-text-primary")}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="block sm:table-row-group">
        {rows.map((row) => (
          <TableRow key={row.label} className={cn(cardTable.row, "grid hover:bg-transparent sm:table-row", columns.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
            <TableHead scope="row" className={cn(cardTable.cell, bodyStyles.sm, "col-span-full block h-auto bg-surface-raised pb-2 align-top font-medium whitespace-normal text-text-muted sm:table-cell sm:bg-transparent sm:pb-3")}>
              {row.label}
            </TableHead>
            {row.cells.map((cell, index) => (
              <TableCell key={columns[index]?.key ?? index} className={cn(cardTable.cell, bodyStyles.md, "block min-w-0 align-top whitespace-normal wrap-anywhere text-text-primary sm:table-cell")}>
                <div aria-hidden="true" className={cn(bodyStyles.sm, "mb-2 font-medium text-text-muted sm:hidden")}>{columns[index]?.mobileLabel}</div>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
