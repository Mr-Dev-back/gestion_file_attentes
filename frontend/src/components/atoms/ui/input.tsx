import * as React from "react"
import { cn } from "../../../lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1">
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error 
                            ? "border-danger focus-visible:ring-danger/20" 
                            : "border-slate-200 focus:border-primary focus-visible:ring-primary/20",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-[10px] font-bold text-danger ml-1 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
