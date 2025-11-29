export interface WebhookPayload {
  event: string;
  [key: string]: any;
}

export async function sendWebhook(
  event: string,
  data: Record<string, any>
): Promise<boolean> {
  const webhookUrl = process.env.GLOBAL_WEBHOOK_URL;
  const apiKey = process.env.GLOBAL_API_KEY;

  if (!webhookUrl) {
    console.warn("GLOBAL_WEBHOOK_URL not configured");
    return false;
  }

  if (!apiKey) {
    console.warn("GLOBAL_API_KEY not configured");
    return false;
  }

  try {
    const payload: WebhookPayload = {
      event,
      ...data,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Webhook error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send webhook:", error);
    return false;
  }
}

export async function sendRecoveryCheckWebhook(
  email: string,
  mobilePhone: string | null,
  externalId: string | null
): Promise<{ email: boolean; whatsapp: boolean }> {
  const webhookUrl = process.env.GLOBAL_WEBHOOK_URL;
  const apiKey = process.env.GLOBAL_API_KEY;

  const defaultMethods = {
    email: isEmailConfiguredCheck(),
    whatsapp: false,
  };

  if (!webhookUrl || !apiKey) {
    return defaultMethods;
  }

  try {
    const payload: WebhookPayload = {
      event: "auth.recovery.check",
      email,
      mobile_phone: mobilePhone,
      external_id: externalId,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Recovery check webhook error:", response.status);
      return defaultMethods;
    }

    const result = await response.json();
    return {
      email: result.email ?? defaultMethods.email,
      whatsapp: result.whatsapp ?? false,
    };
  } catch (error) {
    console.error("Failed to send recovery check webhook:", error);
    return defaultMethods;
  }
}

export async function sendRecoveryRequestWebhook(
  method: "email" | "whatsapp",
  email: string,
  mobilePhone: string | null,
  externalId: string | null,
  userName: string,
  token: string,
  resetUrl: string
): Promise<boolean> {
  const webhookUrl = process.env.GLOBAL_WEBHOOK_URL;
  const apiKey = process.env.GLOBAL_API_KEY;

  if (!webhookUrl || !apiKey) {
    console.warn("GLOBAL_WEBHOOK_URL or GLOBAL_API_KEY not configured");
    return false;
  }

  try {
    const payload: WebhookPayload = {
      event: "auth.recovery.request",
      method,
      email,
      mobile_phone: mobilePhone,
      external_id: externalId,
      userName,
      token,
      resetUrl,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Recovery request webhook error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send recovery request webhook:", error);
    return false;
  }
}

function isEmailConfiguredCheck(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USERNAME &&
    process.env.SMTP_PASSWORD
  );
}

export function isWebhookConfigured(): boolean {
  return !!(process.env.GLOBAL_WEBHOOK_URL && process.env.GLOBAL_API_KEY);
}
