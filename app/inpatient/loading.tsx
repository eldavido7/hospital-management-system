import { MainLayout } from "@/components/layout/main-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Skeleton className="h-4 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Skeleton className="h-3 w-24 mt-1" />
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
