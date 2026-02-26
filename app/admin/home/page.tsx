"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useDashboard } from "./_hooks/use-dashboard"

export default function AdminHomePage() {
  const { data, isLoading } = useDashboard()

  if (isLoading || !data) {
    return <div className="py-6 px-4 text-sm text-muted-foreground">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Operational overview for centers, users and SEO.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Centers Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.centers.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Centers Active</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.centers.active}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Centers Rejected</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.centers.rejected}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registered Patients</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.totalPatients}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Meta Title:</span> {data.seo.metaTitle}</p>
          <p><span className="font-medium">Meta Description:</span> {data.seo.metaDescription}</p>
        </CardContent>
      </Card>
    </div>
  )
}
