import { MainLayout } from "@/components/layout/main-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Loading() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-40" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array(5)
                      .fill(0)
                      .map((_, j) => (
                        <div key={j} className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        <Tabs defaultValue="observations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="observations">
              <Skeleton className="h-4 w-32" />
            </TabsTrigger>
            <TabsTrigger value="treatments">
              <Skeleton className="h-4 w-32" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="observations" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <TableHead key={i}>
                            <Skeleton className="h-4 w-20" />
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          {Array(8)
                            .fill(0)
                            .map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
