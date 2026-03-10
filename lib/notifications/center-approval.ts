import "server-only"

interface CenterDecisionNotificationPayload {
  centerId: string
  authUserId: string
  centerName: string
  contactEmail: string | null
  status: "active" | "deactive" | "rejected" | "blacklisted"
  approvalNote: string | null
  decidedAt: Date | null
}

interface CenterDecisionEmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

interface CenterDecisionNotificationResult {
  dispatched: boolean
  reason?: string
}

const DEFAULT_TIMEOUT_MS = 5000
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://burjcon.com"

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildCenterDecisionEmail(payload: CenterDecisionNotificationPayload): CenterDecisionEmailPayload | null {
  if (!payload.contactEmail) {
    return null
  }

  const safeCenterName = escapeHtml(payload.centerName)
  const safeApprovalNote = payload.approvalNote ? escapeHtml(payload.approvalNote) : null

  if (payload.status === "active") {
    return {
      to: payload.contactEmail,
      subject: "Your center profile has been approved",
      html: `
        <p>Hello,</p>
        <p>Your center profile for <strong>${safeCenterName}</strong> has been approved.</p>
        <p>You can now access your center portal.</p>
        <p><a href="${PORTAL_URL}/login">Go to portal</a></p>
      `,
      text: `Hello,\n\nYour center profile for ${payload.centerName} has been approved.\nYou can now access your center portal.\n\nPortal: ${PORTAL_URL}/login`,
    }
  }

  if (payload.status === "rejected") {
    return {
      to: payload.contactEmail,
      subject: "Your center profile request was rejected",
      html: `
        <p>Hello,</p>
        <p>Your center profile request for <strong>${safeCenterName}</strong> has been rejected.</p>
        ${safeApprovalNote ? `<p>Reason: ${safeApprovalNote}</p>` : ""}
        <p>Please update your details and resubmit your onboarding request.</p>
      `,
      text: `Hello,\n\nYour center profile request for ${payload.centerName} has been rejected.${payload.approvalNote ? `\nReason: ${payload.approvalNote}` : ""}\n\nPlease update your details and resubmit your onboarding request.`,
    }
  }

  return null
}

export async function dispatchCenterDecisionNotification(
  payload: CenterDecisionNotificationPayload,
): Promise<CenterDecisionNotificationResult> {
  const webhookUrl = process.env.CENTER_APPROVAL_NOTIFICATION_WEBHOOK_URL?.trim()

  if (!webhookUrl) {
    return {
      dispatched: false,
      reason: "CENTER_APPROVAL_NOTIFICATION_WEBHOOK_URL is not configured",
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
    const emailPayload = buildCenterDecisionEmail(payload)
    const channelHints = emailPayload ? ["email", "in-app"] : ["in-app"]

    const response = await fetch(
      webhookUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: "center.approval.decided",
          channelHints,
          email: emailPayload,
          payload,
        }),
        signal: controller.signal,
      },
    ).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      return {
        dispatched: false,
        reason: `Notification webhook returned ${response.status}`,
      }
    }

    return { dispatched: true }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown notification error"
    return {
      dispatched: false,
      reason,
    }
  }
}
