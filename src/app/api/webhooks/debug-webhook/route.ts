import crypto from "crypto";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("x-paystack-signature");

  const secret = process.env.PAYSTACK_WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  return Response.json({
    signatureReceived: signature,
    hashComputed: hash,
    match: hash === signature,
    secretLength: secret?.length,
    secretPrefix: secret?.slice(0, 10),
  });
}