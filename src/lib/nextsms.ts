/**
 * NextSMS API Service (V2)
 * Tanzania bulk SMS provider - https://nextsms.co.tz
 * 
 * API Docs: https://documenter.getpostman.com/view/1679195/2sAYkDP1XN
 */

const NEXTSMS_BASE_URL = 'https://messaging-service.co.tz';
const NEXTSMS_API_URL = `${NEXTSMS_BASE_URL}/api/sms/v2/text/single`;
const NEXTSMS_BALANCE_URL = `${NEXTSMS_BASE_URL}/api/v2/balance`;
// Test mode endpoint (free, no charges)
const NEXTSMS_TEST_URL = `${NEXTSMS_BASE_URL}/api/sms/v2/test/text/single`;

interface SendSMSParams {
  to: string;        // Phone number in international format (255...)
  message: string;
  from?: string;     // Sender ID (max 11 chars, registered with NextSMS)
}

interface SendBulkSMSParams {
  recipients: { phone: string; name?: string }[];
  message: string;
  from?: string;
}

interface SMSResult {
  phone: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkSMSResponse {
  totalSent: number;
  totalFailed: number;
  results: SMSResult[];
  balanceAfter?: number;
}

interface BalanceResponse {
  balance: number;
  currency: string;
}

/**
 * Format a Tanzanian phone number to international format (255XXXXXXXXX)
 */
export function formatTanzanianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Local format: 0712345678 -> 255712345678
    cleaned = '255' + cleaned.substring(1);
  } else if (cleaned.startsWith('255') && cleaned.length === 12) {
    // Already international format
  } else if (cleaned.startsWith('+255')) {
    cleaned = cleaned.substring(1); // Remove the +
  } else if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    // Just the number without prefix: 712345678
    cleaned = '255' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate a Tanzanian phone number
 */
export function isValidTanzanianPhone(phone: string): boolean {
  const formatted = formatTanzanianPhone(phone);
  // Must be 12 digits starting with 255
  return /^255[67]\d{8}$/.test(formatted);
}

/**
 * Get the Bearer authorization header for NextSMS API V2
 */
function getAuthHeader(): string {
  const apiKey = process.env.NEXTSMS_API_KEY;
  if (!apiKey) {
    throw new Error('NEXTSMS_API_KEY environment variable is not set');
  }
  return `Bearer ${apiKey}`;
}

/**
 * Send a single SMS via NextSMS API V2
 */
export async function sendSingleSMS({ to, message, from }: SendSMSParams): Promise<SMSResult> {
  const formattedPhone = formatTanzanianPhone(to);
  
  if (!isValidTanzanianPhone(to)) {
    return {
      phone: to,
      success: false,
      error: `Invalid phone number: ${to}`
    };
  }

  // Use test mode if configured
  const useTestMode = process.env.NEXTSMS_TEST_MODE === 'true';
  const apiUrl = useTestMode ? NEXTSMS_TEST_URL : NEXTSMS_API_URL;

  try {
    const requestBody = {
      from: from || process.env.NEXTSMS_SENDER_ID || 'TAG FCC',
      to: formattedPhone,
      text: message,
    };

    console.log(`[NextSMS] Sending to ${formattedPhone} via ${useTestMode ? 'TEST' : 'LIVE'} mode`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    let data: any;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    console.log(`[NextSMS] Response ${response.status}:`, JSON.stringify(data).substring(0, 500));

    if (response.ok) {
      // V2 API returns messages array with status
      const messageStatus = data?.messages?.[0]?.status;
      const statusGroupId = messageStatus?.groupId;
      
      // groupId 18 = PENDING (sent), 20 = DELIVERED, 19 = REJECTED, 22 = FAILED
      if (statusGroupId === 19 || statusGroupId === 22) {
        return {
          phone: formattedPhone,
          success: false,
          error: messageStatus?.description || messageStatus?.name || 'Message rejected',
        };
      }

      return {
        phone: formattedPhone,
        success: true,
        messageId: data?.messages?.[0]?.messageId || data?.messageId || 'sent',
      };
    } else {
      // Extract error message from various response formats
      const errorMsg = 
        data?.requestError?.serviceException?.text ||
        data?.requestError?.serviceException?.messageId ||
        data?.error?.description ||
        data?.error?.message ||
        data?.message ||
        data?.rawResponse ||
        `HTTP ${response.status}`;
      
      return {
        phone: formattedPhone,
        success: false,
        error: errorMsg,
      };
    }
  } catch (error: any) {
    console.error(`[NextSMS] Network error sending to ${formattedPhone}:`, error.message);
    return {
      phone: formattedPhone,
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Send bulk SMS to multiple recipients via NextSMS
 * Sends messages sequentially to avoid rate limiting
 */
export async function sendBulkSMS({ recipients, message, from }: SendBulkSMSParams): Promise<BulkSMSResponse> {
  const results: SMSResult[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const recipient of recipients) {
    const result = await sendSingleSMS({
      to: recipient.phone,
      message,
      from,
    });

    results.push(result);
    if (result.success) {
      totalSent++;
    } else {
      totalFailed++;
    }

    // Small delay between messages to respect rate limits
    if (recipients.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Try to get balance after sending
  let balanceAfter: number | undefined;
  try {
    const balanceData = await getSMSBalance();
    balanceAfter = balanceData.balance;
  } catch {
    // Balance check is optional
  }

  return {
    totalSent,
    totalFailed,
    results,
    balanceAfter,
  };
}

/**
 * Check SMS balance from NextSMS V2 API
 */
export async function getSMSBalance(): Promise<BalanceResponse> {
  try {
    console.log('[NextSMS] Checking balance...');
    
    const response = await fetch(NEXTSMS_BALANCE_URL, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    let data: any;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    console.log('[NextSMS] Balance response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      throw new Error(`Failed to check balance: HTTP ${response.status} - ${JSON.stringify(data)}`);
    }
    
    // V2 API returns: {"sms_balance":64,"over_draft":0,"type":"price","default_balance":4,"default":"Internet Channel","display":"64.00 TZS"}
    const balance = 
      parseFloat(data?.sms_balance) ||
      parseFloat(data?.data?.balance) ||
      parseFloat(data?.balance) ||
      0;

    return {
      balance,
      currency: 'TZS',
    };
  } catch (error: any) {
    console.error('[NextSMS] Balance check error:', error.message);
    throw new Error(`Balance check failed: ${error.message}`);
  }
}
