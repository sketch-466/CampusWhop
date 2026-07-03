export const PAYSTACK_BASE = 'https://api.paystack.co';

export async function paystackRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${PAYSTACK_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Paystack request failed' }));
    throw new Error(error.message || 'Paystack request failed');
  }

  return response.json();
}
