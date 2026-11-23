import type { ReactNode } from "react";
import { cardTable } from "@/components/course/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bodyStyles } from "@/app/fonts";
import { cn } from "@/lib/utils";

export interface ComparisonColumn {
  key: string;
  header: ReactNode;
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
    <Table className={cn("table-fixed min-w-[36rem]", className)}>
      <TableHeader>
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
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label} className={cn(cardTable.row, "hover:bg-transparent")}>
            <TableHead scope="row" className={cn(cardTable.cell, bodyStyles.sm, "h-auto align-top font-medium whitespace-normal text-text-muted")}>
              {row.label}
            </TableHead>
            {row.cells.map((cell, index) => (
              <TableCell key={columns[index]?.key ?? index} className={cn(cardTable.cell, bodyStyles.md, "align-top whitespace-normal text-text-primary")}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
