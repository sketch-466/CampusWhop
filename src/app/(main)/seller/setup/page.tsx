"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getBanks, verifyAccount, createSubaccount } from "@/lib/actions/subaccounts";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const setupSchema = z.object({
  business_name: z.string().min(2, "Business name required"),
  bank_code: z.string().min(1, "Select a bank"),
  account_number: z.string().length(10, "Account number must be 10 digits"),
});

type SetupInput = z.infer<typeof setupSchema>;

interface Bank {
  name: string;
  code: string;
  slug: string;
}

export default function SellerSetupPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [accountName, setAccountName] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SetupInput>({
    resolver: zodResolver(setupSchema),
  });

  const bankCode = watch("bank_code");
  const accountNumber = watch("account_number");

  useEffect(() => {
    getBanks().then((result) => {
      if (result.banks) {
        setBanks(result.banks);
      }
      setLoadingBanks(false);
    });
  }, []);

  useEffect(() => {
    if (bankCode && accountNumber?.length === 10) {
      setVerifying(true);
      setAccountName(undefined);
      verifyAccount(bankCode, accountNumber).then((result) => {
        if (result.accountName) {
          setAccountName(result.accountName);
        }
        setVerifying(false);
      });
    }
  }, [bankCode, accountNumber]);

  const onSubmit = async (data: SetupInput) => {
    if (!accountName) {
      setError("Please verify your account number first");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    const bank = banks.find((b) => b.code === data.bank_code);
    const result = await createSubaccount({
      business_name: data.business_name,
      bank_name: bank?.name || "",
      bank_code: data.bank_code,
      account_number: data.account_number,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 p-8">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-emerald-400">
            Payout Account Set Up!
          </h2>
          <p className="mt-2 text-sm text-emerald-300">
            You can now receive payments for your sales on CampusWhop.
          </p>
          <Button
            onClick={() => router.push("/marketplace/new")}
            className="mt-6 bg-emerald-500 hover:bg-emerald-600"
          >
            Create Your First Listing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="text-2xl font-bold text-white">Seller Setup</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Set up your payout account to receive payments
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            {...register("business_name")}
            placeholder="Your store or business name"
            className={errors.business_name ? "border-red-500" : ""}
          />
          {errors.business_name && (
            <p className="text-xs text-red-400">{errors.business_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank">Bank</Label>
          {loadingBanks ? (
            <div className="flex h-10 items-center rounded-md border border-zinc-700 bg-zinc-900 px-3">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
              <span className="ml-2 text-sm text-zinc-500">Loading banks...</span>
            </div>
          ) : (
            <select
              id="bank"
              {...register("bank_code")}
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Select a bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          )}
          {errors.bank_code && (
            <p className="text-xs text-red-400">{errors.bank_code.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_number">Account Number</Label>
          <Input
            id="account_number"
            {...register("account_number")}
            placeholder="10 digit account number"
            maxLength={10}
            className={errors.account_number ? "border-red-500" : ""}
          />
          {errors.account_number && (
            <p className="text-xs text-red-400">{errors.account_number.message}</p>
          )}
          {verifying && (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Verifying account...
            </p>
          )}
          {accountName && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              {accountName}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || !accountName}
          className="w-full bg-emerald-500 hover:bg-emerald-600"
        >
          {isSubmitting ? "Setting up..." : "Complete Setup"}
        </Button>
      </form>
    </div>
  );
}
