"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
          <CardContent className="text-2xl font-semibold">{data.centers.submitted}</CardContent>
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
            <CardTitle className="text-base">Total Users (Website)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data.totalUsers}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Based Centers</CardTitle>
        </CardHeader>
        <CardContent>
          {data.centersByLocation.length === 0 ? (
            <p className="text-sm text-muted-foreground">No location data found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Total Centers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.centersByLocation.map((item) => (
                  <TableRow key={item.location}>
                    <TableCell className="font-medium">{item.location}</TableCell>
                    <TableCell className="text-right">{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Users (Website)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Si.no</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Profile Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user, index) => (
                  <TableRow key={user.id ?? `${user.email ?? "user"}-${index}`}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>{user.phoneNumber || "—"}</TableCell>
                    <TableCell>{user.profileName || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Showing the latest {data.users.length} users.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
