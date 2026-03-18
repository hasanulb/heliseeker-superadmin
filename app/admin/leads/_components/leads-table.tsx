"use client"

import Link from "next/link"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type LeadRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  message: string | null
  source: string | null
  createdAt: string | Date
}

function formatCreatedAt(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

function snippet(value: string | null, max = 80) {
  if (!value) return "—"
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">
              {lead.firstName} {lead.lastName}
            </TableCell>
            <TableCell>{lead.email}</TableCell>
            <TableCell>{lead.phone || "—"}</TableCell>
            <TableCell className="max-w-[380px]">{snippet(lead.message)}</TableCell>
            <TableCell>{lead.source || "—"}</TableCell>
            <TableCell>{formatCreatedAt(lead.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/leads/${lead.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

