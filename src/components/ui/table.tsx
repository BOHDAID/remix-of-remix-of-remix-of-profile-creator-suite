import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [canScrollX, setCanScrollX] = React.useState(false);
    const [canScrollY, setCanScrollY] = React.useState(false);

    React.useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const update = () => {
        setCanScrollX(el.scrollWidth > el.clientWidth + 2);
        setCanScrollY(el.scrollHeight > el.clientHeight + 2);
      };

      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      window.addEventListener("resize", update);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", update);
      };
    }, []);

    const scrollX = (dir: "left" | "right") => {
      const el = containerRef.current;
      if (!el) return;
      const delta = dir === "left" ? -260 : 260;
      el.scrollBy({ left: delta, behavior: "smooth" });
    };

    const scrollY = (dir: "up" | "down") => {
      const el = containerRef.current;
      if (!el) return;
      const delta = dir === "up" ? -200 : 200;
      el.scrollBy({ top: delta, behavior: "smooth" });
    };

    return (
      <div className="relative w-full">
        <div
          ref={containerRef}
          className="w-full max-h-[70vh] overflow-auto [scrollbar-width:thin]"
        >
          <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
        </div>

        {/* Horizontal scroll arrows */}
        {canScrollX && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => scrollX("left")}
              className={cn(
                "pointer-events-auto h-8 w-8 rounded-full border border-border",
                "bg-background/80 backdrop-blur shadow-sm",
              )}
              aria-label="تمرير يسار"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => scrollX("right")}
              className={cn(
                "pointer-events-auto h-8 w-8 rounded-full border border-border",
                "bg-background/80 backdrop-blur shadow-sm",
              )}
              aria-label="تمرير يمين"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Vertical scroll arrows */}
        {canScrollY && (
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-between py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => scrollY("up")}
              className={cn(
                "pointer-events-auto h-8 w-8 rounded-full border border-border",
                "bg-background/80 backdrop-blur shadow-sm",
              )}
              aria-label="تمرير للأعلى"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => scrollY("down")}
              className={cn(
                "pointer-events-auto h-8 w-8 rounded-full border border-border",
                "bg-background/80 backdrop-blur shadow-sm",
              )}
              aria-label="تمرير للأسفل"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
