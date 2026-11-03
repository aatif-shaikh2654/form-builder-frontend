"use client"

import * as React from "react"
import { cn } from "cn"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-transparent p-1 w-[268px] select-none",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("relative flex flex-col gap-3", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between z-10",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "size-7 p-0 flex items-center justify-center rounded-md border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-2xs",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "size-7 p-0 flex items-center justify-center rounded-md border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-2xs",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-7 w-full items-center justify-center px-8 text-sm font-semibold text-foreground select-none",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-7 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        caption_label: cn(
          "font-semibold text-sm select-none text-foreground",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse mt-1", defaultClassNames.month_grid),
        weekdays: cn("flex w-full items-center justify-between mb-1", defaultClassNames.weekdays),
        weekday: cn(
          "w-8 text-center text-[11px] font-medium text-muted-foreground select-none py-1 uppercase tracking-wider",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full items-center justify-between mt-1", defaultClassNames.week),
        day: cn(
          "w-8 h-8 p-0 flex items-center justify-center text-center select-none",
          defaultClassNames.day
        ),
        today: cn("font-bold text-primary", defaultClassNames.today),
        outside: cn(
          "text-muted-foreground/35 aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground/30 opacity-35 cursor-not-allowed pointer-events-none",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-3.5", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-3.5", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-3.5", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const isSelected = Boolean(
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle
  )
  const isToday = Boolean(modifiers.today)
  const isOutside = Boolean(modifiers.outside)
  const isDisabled = Boolean(modifiers.disabled)

  return (
    <button
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelected}
      data-today={isToday}
      className={cn(
        "size-8 p-0 flex items-center justify-center rounded-md text-xs font-normal transition-all cursor-pointer select-none",
        "hover:bg-accent hover:text-accent-foreground",
        isToday && !isSelected && "font-bold text-primary bg-primary/10 border border-primary/30",
        isSelected && "!bg-primary !text-primary-foreground font-semibold shadow-xs hover:!bg-primary/90",
        isOutside && "text-muted-foreground/35",
        isDisabled && "text-muted-foreground/25 opacity-35 cursor-not-allowed pointer-events-none",
        "focus-visible:ring-1 focus-visible:ring-ring outline-none",
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
