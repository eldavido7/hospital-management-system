import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-[300px]" />

        <div className="flex space-x-4">
          <div className="w-full md:w-2/3">
            <Skeleton className="h-[600px] w-full" />
          </div>

          <div className="hidden md:block w-1/3">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

