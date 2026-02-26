import { Patient } from "@/lib/admin-panel/types"

interface ReferralHistoryProps {
  patient: Patient
}

export function ReferralHistory({ patient }: ReferralHistoryProps) {
  return (
    <div className="space-y-2 text-sm">
      {patient.referralHistory.length === 0 ? (
        <p className="text-muted-foreground">No referral usage history.</p>
      ) : (
        patient.referralHistory.map((item, idx) => (
          <div key={`${patient.id}-${idx}`} className="rounded border p-2">
            <p><span className="font-medium">Center:</span> {item.centerName}</p>
            <p><span className="font-medium">Used At:</span> {new Date(item.usedAt).toLocaleString()}</p>
            <p><span className="font-medium">Note:</span> {item.note}</p>
          </div>
        ))
      )}
    </div>
  )
}
