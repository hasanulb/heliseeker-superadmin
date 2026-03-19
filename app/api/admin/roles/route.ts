import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"
import { Role, StaffPermission } from "@/lib/admin-panel/types"

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase()
}

export async function GET() {
  const supabase = await getServerSupabase()

  const { data, error } = await supabase
    .from("roles")
    .select(
      "role_id, name, created_at, role_permissions (module_id, permission_id, modules (module_name), permissions (permission_name))",
    )
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const roles: Role[] = (data || []).map((row: any) => {
    const byModule = new Map<string, StaffPermission>()

    for (const rp of row.role_permissions || []) {
      const moduleKey = rp?.modules?.module_name as string | undefined
      const permKey = rp?.permissions?.permission_name as string | undefined
      if (!moduleKey || !permKey) continue

      const current = byModule.get(moduleKey) || { module: moduleKey, view: false, create: false, edit: false, delete: false }
      if (normalize(permKey) === "view") current.view = true
      if (normalize(permKey) === "create") current.create = true
      if (normalize(permKey) === "edit") current.edit = true
      if (normalize(permKey) === "delete") current.delete = true
      byModule.set(moduleKey, current)
    }

    return {
      id: row.role_id,
      name: row.name,
      permissions: Array.from(byModule.values()),
    }
  })

  return NextResponse.json({ data: roles })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    name: string
    permissions: StaffPermission[]
  }

  const name = payload.name?.trim()
  if (!name) {
    return NextResponse.json({ message: "Role name is required" }, { status: 400 })
  }

  const supabase = await getServerSupabase()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user?.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .insert([{ name }])
    .select("role_id, name")
    .single()

  if (roleError || !roleRow?.role_id) {
    const status = /duplicate|unique|already exists/i.test(roleError?.message || "") ? 409 : 500
    return NextResponse.json({ message: roleError?.message || "Failed to create role" }, { status })
  }

  const seenModules = new Set<string>()
  const nextPermissions = (payload.permissions || [])
    .filter((permission) => permission && typeof permission.module === "string" && permission.module.trim())
    .map((permission) => ({
      module: permission.module.trim(),
      view: Boolean(permission.view),
      create: Boolean(permission.create),
      edit: Boolean(permission.edit),
      delete: Boolean(permission.delete),
    }))
    .filter((permission) => {
      const key = normalize(permission.module)
      if (!key) return false
      if (seenModules.has(key)) return false
      seenModules.add(key)
      return true
    })

  if (nextPermissions.length > 0) {
    const moduleNames = Array.from(new Set(nextPermissions.map((p) => p.module)))

    const { error: upsertModuleError } = await supabase
      .from("modules")
      .upsert(moduleNames.map((moduleName) => ({ module_name: moduleName })), { onConflict: "module_name" })

    if (upsertModuleError) {
      await supabase.from("roles").delete().eq("role_id", roleRow.role_id)
      return NextResponse.json({ message: upsertModuleError.message }, { status: 500 })
    }

    const [{ data: modulesData, error: modulesError }, { data: permsData, error: permsError }] = await Promise.all([
      supabase.from("modules").select("module_id, module_name").in("module_name", moduleNames),
      supabase.from("permissions").select("permission_id, permission_name").in("permission_name", ["view", "create", "edit", "delete"]),
    ])

    if (modulesError) {
      await supabase.from("roles").delete().eq("role_id", roleRow.role_id)
      return NextResponse.json({ message: modulesError.message }, { status: 500 })
    }

    if (permsError) {
      await supabase.from("roles").delete().eq("role_id", roleRow.role_id)
      return NextResponse.json({ message: permsError.message }, { status: 500 })
    }

    const moduleIdByName = new Map<string, string>((modulesData || []).map((m: any) => [m.module_name, m.module_id]))
    const permIdByName = new Map<string, string>((permsData || []).map((p: any) => [normalize(p.permission_name), p.permission_id]))

    const viewId = permIdByName.get("view")
    const createId = permIdByName.get("create")
    const editId = permIdByName.get("edit")
    const deleteId = permIdByName.get("delete")

    if (!viewId || !createId || !editId || !deleteId) {
      await supabase.from("roles").delete().eq("role_id", roleRow.role_id)
      return NextResponse.json({ message: "Missing base permissions (view/create/edit/delete) in permissions table" }, { status: 500 })
    }

    const joinRows: Array<{ role_id: string; module_id: string; permission_id: string }> = []

    for (const p of nextPermissions) {
      const moduleId = moduleIdByName.get(p.module)
      if (!moduleId) continue
      if (p.view) joinRows.push({ role_id: roleRow.role_id, module_id: moduleId, permission_id: viewId })
      if (p.create) joinRows.push({ role_id: roleRow.role_id, module_id: moduleId, permission_id: createId })
      if (p.edit) joinRows.push({ role_id: roleRow.role_id, module_id: moduleId, permission_id: editId })
      if (p.delete) joinRows.push({ role_id: roleRow.role_id, module_id: moduleId, permission_id: deleteId })
    }

    if (joinRows.length > 0) {
      const { error: joinError } = await supabase.from("role_permissions").insert(joinRows)
      if (joinError) {
        await supabase.from("roles").delete().eq("role_id", roleRow.role_id)
        return NextResponse.json({ message: joinError.message }, { status: 500 })
      }
    }
  }

  const role: Role = {
    id: roleRow.role_id,
    name: roleRow.name,
    permissions: nextPermissions,
  }

  return NextResponse.json({ data: role }, { status: 201 })
}
