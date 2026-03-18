import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"
import { Role, StaffPermission } from "@/lib/admin-panel/types"

function normalize(value?: string | null) {
  return (value || "").trim().toLowerCase()
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as {
    name?: string
    permissions?: StaffPermission[]
  }

  const supabase = await getServerSupabase()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user?.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const { data: existing, error: existingError } = await supabase
    .from("roles")
    .select("role_id, name")
    .eq("role_id", id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ message: existingError?.message || "Role not found" }, { status: 404 })
  }

  const nextName = payload.name?.trim()
  if (nextName && nextName !== existing.name) {
    const { error: updateError } = await supabase.from("roles").update({ name: nextName }).eq("role_id", id)
    if (updateError) {
      const status = /duplicate|unique|already exists/i.test(updateError.message || "") ? 409 : 500
      return NextResponse.json({ message: updateError.message }, { status })
    }
  }

  let nextPermissions: StaffPermission[] | null = null
  if (payload.permissions) {
    const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", id)
    if (deleteError) {
      return NextResponse.json({ message: deleteError.message }, { status: 500 })
    }

    const seenModules = new Set<string>()
    const requested = payload.permissions
      .filter((permission) => permission && typeof permission.module === "string" && permission.module.trim())
      .map((permission) => ({
        module: permission.module.trim(),
        view: Boolean(permission.view),
        create: Boolean(permission.create),
        edit: Boolean(permission.edit),
      }))
      .filter((permission) => {
        const key = permission.module.toLowerCase()
        if (seenModules.has(key)) return false
        seenModules.add(key)
        return true
      })

    if (requested.length > 0) {
      const moduleNames = Array.from(new Set(requested.map((p) => p.module)))

      const { error: upsertModuleError } = await supabase
        .from("modules")
        .upsert(moduleNames.map((moduleName) => ({ module_name: moduleName })), { onConflict: "module_name" })

      if (upsertModuleError) {
        return NextResponse.json({ message: upsertModuleError.message }, { status: 500 })
      }

      const [{ data: modulesData, error: modulesError }, { data: permsData, error: permsError }] = await Promise.all([
        supabase.from("modules").select("module_id, module_name").in("module_name", moduleNames),
        supabase.from("permissions").select("permission_id, permission_name").in("permission_name", ["view", "create", "edit"]),
      ])

      if (modulesError) {
        return NextResponse.json({ message: modulesError.message }, { status: 500 })
      }

      if (permsError) {
        return NextResponse.json({ message: permsError.message }, { status: 500 })
      }

      const moduleIdByName = new Map<string, string>((modulesData || []).map((m: any) => [m.module_name, m.module_id]))
      const permIdByName = new Map<string, string>((permsData || []).map((p: any) => [normalize(p.permission_name), p.permission_id]))

      const viewId = permIdByName.get("view")
      const createId = permIdByName.get("create")
      const editId = permIdByName.get("edit")

      if (!viewId || !createId || !editId) {
        return NextResponse.json({ message: "Missing base permissions (view/create/edit) in permissions table" }, { status: 500 })
      }

      const joinRows: Array<{ role_id: string; module_id: string; permission_id: string }> = []

      for (const p of requested) {
        const moduleId = moduleIdByName.get(p.module)
        if (!moduleId) continue
        if (p.view) joinRows.push({ role_id: id, module_id: moduleId, permission_id: viewId })
        if (p.create) joinRows.push({ role_id: id, module_id: moduleId, permission_id: createId })
        if (p.edit) joinRows.push({ role_id: id, module_id: moduleId, permission_id: editId })
      }

      if (joinRows.length > 0) {
        const { error: insertError } = await supabase.from("role_permissions").insert(joinRows)
        if (insertError) {
          return NextResponse.json({ message: insertError.message }, { status: 500 })
        }
      }
    }

    nextPermissions = requested
  }

  const { data: roleWithPerms, error: fetchError } = await supabase
    .from("roles")
    .select("role_id, name, role_permissions (modules (module_name), permissions (permission_name))")
    .eq("role_id", id)
    .single()

  if (fetchError || !roleWithPerms) {
    return NextResponse.json({ message: fetchError?.message || "Failed to load updated role" }, { status: 500 })
  }

  const nextRole: Role = {
    id: roleWithPerms.role_id,
    name: roleWithPerms.name,
    permissions:
      nextPermissions ??
      (() => {
        const byModule = new Map<string, StaffPermission>()
        for (const rp of roleWithPerms.role_permissions || []) {
          const moduleKey = rp?.modules?.module_name as string | undefined
          const permKey = rp?.permissions?.permission_name as string | undefined
          if (!moduleKey || !permKey) continue
          const current = byModule.get(moduleKey) || { module: moduleKey, view: false, create: false, edit: false }
          if (normalize(permKey) === "view") current.view = true
          if (normalize(permKey) === "create") current.create = true
          if (normalize(permKey) === "edit") current.edit = true
          byModule.set(moduleKey, current)
        }
        return Array.from(byModule.values())
      })(),
  }

  return NextResponse.json({ data: nextRole })
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await getServerSupabase()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user?.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const { data: existing, error: existingError } = await supabase
    .from("roles")
    .select("role_id, name, role_permissions (modules (module_name), permissions (permission_name))")
    .eq("role_id", id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ message: existingError?.message || "Role not found" }, { status: 404 })
  }

  const { data: adminsUsingRole, error: usageError } = await supabase
    .from("admins")
    .select("admin_id")
    .eq("role", existing.name)
    .limit(1)

  if (usageError) {
    return NextResponse.json({ message: usageError.message }, { status: 500 })
  }

  if ((adminsUsingRole || []).length > 0) {
    return NextResponse.json(
      { message: "Role is assigned to one or more staff users. Reassign them before deleting." },
      { status: 409 },
    )
  }

  const { error: deleteError } = await supabase.from("roles").delete().eq("role_id", id)
  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 500 })
  }

  const deleted: Role = {
    id: existing.role_id,
    name: existing.name,
    permissions: (() => {
      const byModule = new Map<string, StaffPermission>()
      for (const rp of existing.role_permissions || []) {
        const moduleKey = rp?.modules?.module_name as string | undefined
        const permKey = rp?.permissions?.permission_name as string | undefined
        if (!moduleKey || !permKey) continue
        const current = byModule.get(moduleKey) || { module: moduleKey, view: false, create: false, edit: false }
        if (normalize(permKey) === "view") current.view = true
        if (normalize(permKey) === "create") current.create = true
        if (normalize(permKey) === "edit") current.edit = true
        byModule.set(moduleKey, current)
      }
      return Array.from(byModule.values())
    })(),
  }

  return NextResponse.json({ data: deleted })
}
