import { Drawer } from "@base-ui/react/drawer"
import { useRef, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface DetailSheetProps {
  title: string
  description: string
  open: boolean
  onOpenChange: Drawer.Root.Props["onOpenChange"]
  onClosed?: () => void
  children: ReactNode
  footer?: ReactNode
  trigger?: ReactNode
  finalFocus?: Drawer.Popup.Props["finalFocus"]
  size?: "default" | "wide"
  className?: string
}

export function DetailSheet({
  title,
  description,
  open,
  onOpenChange,
  onClosed,
  children,
  footer,
  trigger,
  finalFocus,
  size = "default",
  className,
}: DetailSheetProps) {
  const mobile = useIsMobile()
  const heading = useRef<HTMLHeadingElement>(null)
  const [scrolled, setScrolled] = useState(false)
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={mobile ? "down" : "right"}
      onOpenChangeComplete={(visible) => {
        if (!visible) {
          setScrolled(false)
          onClosed?.()
        }
      }}
    >
      {trigger}
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop className="detail-sheet-backdrop" />
          <Drawer.Viewport className="detail-sheet-viewport">
            <Drawer.Popup
              initialFocus={heading}
              finalFocus={finalFocus}
              data-size={size}
              className={cn("detail-sheet-popup", className)}
            >
              <header className="shrink-0 border-b border-separator-border px-5 py-5 sm:px-6">
                <div
                  aria-hidden
                  className="mx-auto mb-4 h-1 w-10 rounded-full bg-background-tertiary-default md:hidden"
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <Drawer.Title
                      ref={heading}
                      tabIndex={-1}
                      className="text-title-2-medium break-words text-text-primary outline-none"
                    >
                      {title}
                    </Drawer.Title>
                    <Drawer.Description className="text-body-regular text-text-secondary">
                      {description}
                    </Drawer.Description>
                  </div>
                  <Drawer.Close
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Close ${title}`}
                      />
                    }
                  >
                    <X aria-hidden />
                  </Drawer.Close>
                </div>
              </header>
              <div className="relative flex min-h-0 flex-1 flex-col">
                <div
                  aria-hidden
                  className={cn(
                    "detail-sheet-fade",
                    scrolled ? "opacity-100" : "opacity-0"
                  )}
                />
                <Drawer.Content
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-6"
                  onScroll={(event) =>
                    setScrolled(event.currentTarget.scrollTop > 8)
                  }
                >
                  {children}
                </Drawer.Content>
              </div>
              {footer && (
                <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-separator-border bg-background-primary-default px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  {footer}
                </footer>
              )}
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  )
}

export const DetailSheetTrigger = Drawer.Trigger
export const DetailSheetClose = Drawer.Close
