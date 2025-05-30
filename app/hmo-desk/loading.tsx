import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function HMODeskLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <Skeleton className="h-10 w-[300px]" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Skeleton className="h-10 w-full mb-4" />

          <div className="space-y-4">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px] mt-2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Skeleton className="h-16 w-16 rounded-full mb-4" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px] mt-2" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

