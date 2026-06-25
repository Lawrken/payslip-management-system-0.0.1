"use client"

import { Button } from "@/components/ui/button"

export default function PayslipsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        The service is temporarily unavailable. This usually resolves in a few
        seconds.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
