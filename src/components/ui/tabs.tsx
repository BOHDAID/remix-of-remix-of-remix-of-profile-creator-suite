import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, forwardedRef) => {
  const listRef = React.useRef<React.ElementRef<typeof TabsPrimitive.List> | null>(null);
  const [canScroll, setCanScroll] = React.useState(false);

  React.useImperativeHandle(forwardedRef, () => listRef.current as React.ElementRef<typeof TabsPrimitive.List>);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const update = () => {
      setCanScroll(el.scrollWidth > el.clientWidth + 2);
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

  const scroll = (dir: "left" | "right") => {
    const el = listRef.current;
    if (!el) return;
    const delta = dir === "left" ? -260 : 260;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <TabsPrimitive.List
        ref={listRef}
        className={cn(
          "relative flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground",
          "gap-1 overflow-x-auto whitespace-nowrap",
          "[scrollbar-width:thin]",
          className,
        )}
        {...props}
      />

      {canScroll && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
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
            onClick={() => scroll("right")}
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
    </div>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

