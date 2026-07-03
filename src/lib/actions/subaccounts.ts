"use server";

import { createClient } from "@/lib/supabase/server";
import { paystackRequest } from "@/lib/paystack/client";

export async function getBanks() {
  try {
    const result = await paystackRequest("/bank?country=nigeria");
    return { banks: result.data || [] };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to fetch banks",
    };
  }
}

export async function verifyAccount(bankCode: string, accountNumber: string) {
  try {
    const result = await paystackRequest(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return { accountName: result.data.account_name };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to verify account",
    };
  }
}

export async function createSubaccount(data: {
  business_name: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already has subaccount
  const { data: existing } = await supabase
    .from("paystack_subaccounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "You already have a payout account set up" };
  }

  try {
    // Create Paystack subaccount - seller gets 90%, platform keeps 10%
    const result = await paystackRequest("/subaccount", {
      method: "POST",
      body: JSON.stringify({
        business_name: data.business_name,
        settlement_bank: data.bank_code,
        account_number: data.account_number,
        percentage_charge: 90, // Seller receives 90%
      }),
    });

    if (!result.status) {
      throw new Error(result.message);
    }

    // Store in database
    const { error: dbError } = await supabase
      .from("paystack_subaccounts")
      .insert({
        user_id: user.id,
        subaccount_code: result.data.subaccount_code,
        business_name: data.business_name,
        bank_name: data.bank_name,
        account_number: data.account_number,
      });

    if (dbError) {
      return { error: "Failed to save subaccount" };
    }

    return { success: true, subaccountCode: result.data.subaccount_code };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to create subaccount",
    };
  }
}
