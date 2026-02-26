"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"

import { TeamType } from "../../types"
import { TeamService } from "@/services/api/team.service"
import { useToast } from "@/hooks/use-toast"
import { LabelAndValueComponent } from "@/components/custom-ui"
import { ContentDetailLayout, ImagePreviews } from "@/components/common"
import { ImageType, LocaleEnum, LocaleEnumLabel } from "@/lib/types"

export default function TeamDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [team, setTeam] = useState<TeamType | null>(null)
  const [loading, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      async function fetchTeam() {
        try {
          const data:any = await new TeamService().getTeam(id)
          setTeam(data)
          setIsInitialLoad(false)
        } catch (err: any) {
          toast({ title: "Error", description: err.message || "Error fetching team", variant: "destructive" })
          setIsInitialLoad(false)
        } finally {
          setIsInitialLoad(false)
        }
      }
      if (id) fetchTeam()
    })
  }, [id])

  return (
    <ContentDetailLayout
      title="Team Details"
      onEdit={() => router.push(`/admin/content/team/edit/${id}`)}
      loading={loading || isInitialLoad}
      notFound={!team}
      notFoundMessage="Team not found."
    >
      {team && (
        <>
          {Object.values(LocaleEnum).map((locale) => {
            const localeKey = Object.keys(LocaleEnum).find(key => LocaleEnum[key as keyof typeof LocaleEnum] === locale) as keyof typeof LocaleEnumLabel
            return (
              <div key={locale} className="mb-6 border rounded">
                <h2 className="text-lg font-semibold border-b px-4 py-2">{LocaleEnumLabel[localeKey]}</h2>
                <div className="space-y-4 p-4">
                  <LabelAndValueComponent label="Name" value={team.name?.[locale]} />
                  <LabelAndValueComponent label="Intro" value={team.description?.[locale]} noSpan />
                  <LabelAndValueComponent label="Position" value={team.position?.[locale]} noSpan />
                </div>
              </div>
            )
          })}
          <LabelAndValueComponent label="Created At" value={new Date(team.created_at).toLocaleString()} />
          <LabelAndValueComponent label="Updated At" value={new Date(team.updated_at).toLocaleString()} />
          <div>
            <span className="text-sm font-semibold text-primary">Images:</span>
            <ImagePreviews previews={team.img_urls} for_={ImageType.ViewOnly} />
          </div>
        </>
      )}
    </ContentDetailLayout>
  )
}
