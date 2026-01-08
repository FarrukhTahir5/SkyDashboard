import * as React from "react"

const Select = React.forwardRef(({ className = "", value, onValueChange, children, ...props }, ref) => {
    return (
        <select
            className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            {...props}
        >
            {children}
        </select>
    )
})

Select.displayName = "Select"

const SelectItem = React.forwardRef(({ className = "", children, ...props }, ref) => {
    return (
        <option
            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
            ref={ref}
            {...props}
        >
            {children}
        </option>
    )
})

SelectItem.displayName = "SelectItem"

export { Select, SelectItem }
