import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Dir = "left" | "right";

export function HorizontalScrollActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2;
      if (!hasOverflow) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };

    // initial + after layout settles
    update();
    requestAnimationFrame(update);
    const t = window.setTimeout(update, 150);

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    el.addEventListener("scroll", update, { passive: true });

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", update);
      el.removeEventListener("scroll", update);
    };
  }, []);

  const scroll = (dir: Dir) => {
    const el = ref.current;
    if (!el) return;
    const delta = dir === "left" ? -260 : 260;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 overflow-x-auto whitespace-nowrap",
          "[scrollbar-width:thin]",
        )}
      >
        {children}
      </div>

      {(canScrollLeft || canScrollRight) && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "pointer-events-auto h-8 w-8 rounded-full border border-border",
              "bg-background/80 backdrop-blur shadow-sm",
              "disabled:opacity-40",
            )}
            aria-label="تمرير يسار"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "pointer-events-auto h-8 w-8 rounded-full border border-border",
              "bg-background/80 backdrop-blur shadow-sm",
              "disabled:opacity-40",
            )}
            aria-label="تمرير يمين"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
