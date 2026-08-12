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
    const error = await response.json().catch(() => ({
      message: 'Paystack request failed',
    }));
    throw new Error(error.message || 'Paystack request failed');
  }

  return response.json();
}

/**
 * Calculate platform fee for a seller.
 * Founding creators are fee-exempt for 3 months from their exemption date.
 * Everyone else pays 10%.
 */
export function calculatePlatformFee(
  amount: number,
  feeExemptUntil?: string | null
): { platformFee: number; sellerAmount: number; isExempt: boolean } {
  const isExempt =
    !!feeExemptUntil && new Date(feeExemptUntil) > new Date();

  const platformFee = isExempt ? 0 : Math.floor(amount * 0.1);
  const sellerAmount = amount - platformFee;

  return { platformFee, sellerAmount, isExempt };
}