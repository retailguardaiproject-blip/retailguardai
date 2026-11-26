export interface RetailGuardSummary {
  id: string;
  receivedAt: string;
  totalRecords: number;
  inventoryAlerts: number;
  discountAlerts: number;
  returnsAlerts: number;
  recordsRequiringReview: number;
  recordsWithValidationIssues: number;
  cases: Array<Record<string, unknown>>;
}

export async function getRetailGuardSummary(): Promise<RetailGuardSummary | null> {
  const apiUrl = process.env.RETAILGUARD_API_URL;
  const apiKey = process.env.RETAILGUARD_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('Missing RETAILGUARD_API_URL or RETAILGUARD_API_KEY environment variables.');
  }

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
    // Next.js: fetch fresh data, or revalidate every 60 seconds
    next: { revalidate: 60 },
  });

  if (response.status === 404) {
    // No summary has been pushed by n8n yet
    return null;
  }

  if (response.status === 401) {
    throw new Error('Invalid API key: please verify RETAILGUARD_API_KEY matches N8N_SUMMARY_SECRET.');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
