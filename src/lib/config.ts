// Configuration utility for FCC Church Management System

export const config = {
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // Church information
  church: {
    name: process.env.NEXT_PUBLIC_CHURCH_NAME || 'Filadefia Christian Center',
    shortName: process.env.NEXT_PUBLIC_CHURCH_SHORT_NAME || 'FCC',
    denomination: process.env.NEXT_PUBLIC_CHURCH_DENOMINATION || 'Tanzania Assemblies of God (TAG)',
  },
  
  // Email configuration
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
  },
  
  // SMS configuration
  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    apiUrl: process.env.SMS_API_URL || '',
  },
  
  // Mobile money configuration
  mobileMoney: {
    mpesa: process.env.MPESA_API_KEY || '',
    tigoPesa: process.env.TIGO_PESA_API_KEY || '',
    airtelMoney: process.env.AIRTEL_MONEY_API_KEY || '',
    crdb: process.env.CRDB_API_KEY || '',
  },
};

// Helper functions
export const isSupabaseConfigured = (): boolean => {
  const url = config.supabase.url?.trim();
  const key = config.supabase.anonKey?.trim();
  
  const hasUrl = url && (url.startsWith('http://') || url.startsWith('https://'));
  const hasKey = key && key.length > 10;
  
  console.log('Supabase Config Check:', {
    url: url ? `${url.substring(0, 20)}...` : 'Missing',
    urlValid: hasUrl,
    keyValid: hasKey,
    configured: !!(hasUrl && hasKey)
  });
  
  return !!(hasUrl && hasKey);
};

export const isEmailConfigured = (): boolean => {
  return !!(config.email.host && config.email.user && config.email.password);
};

export const isSmsConfigured = (): boolean => {
  return !!(config.sms.apiKey && config.sms.apiUrl);
};

export const getMobileMoneyProviders = (): string[] => {
  const providers: string[] = [];
  if (config.mobileMoney.mpesa) providers.push('M-Pesa');
  if (config.mobileMoney.tigoPesa) providers.push('TigoPesa');
  if (config.mobileMoney.airtelMoney) providers.push('Airtel Money');
  if (config.mobileMoney.crdb) providers.push('CRDB Bank');
  return providers;
};

export default config;