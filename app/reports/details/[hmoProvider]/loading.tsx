import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function HMODetailsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[150px] mt-2" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[100px]" />
          <Skeleton className="h-4 w-[200px] mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[50px] mt-2" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[50px] mt-2" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[100px] mt-2" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[100px] mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Skeleton className="h-6 w-[150px] mb-4" />

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-4 w-[200px] mt-2" />
                </div>
                <Skeleton className="h-6 w-[100px]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <div>
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-4 w-[180px] mt-2" />
                    </div>
                    <Skeleton className="h-6 w-[100px]" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-[100px] mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>

                    <div>
                      <Skeleton className="h-4 w-[100px] mb-1" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>

                    <div>
                      <Skeleton className="h-4 w-[100px] mb-1" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-4 w-[200px] mt-2" />
                </div>
                <Skeleton className="h-6 w-[100px]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <div>
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-4 w-[180px] mt-2" />
                    </div>
                    <Skeleton className="h-6 w-[100px]" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Skeleton className="h-4 w-[100px] mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>

                    <div>
                      <Skeleton className="h-4 w-[100px] mb-1" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

