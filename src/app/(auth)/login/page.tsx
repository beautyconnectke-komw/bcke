import Image from "next/image";
import { AuthForm } from "@/components/shared/auth-form";

export default function LoginPage() {
  return (
    <section className="w-full max-w-[390px]">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/logo/logo.png"
          alt="Beauty Connect"
          width={52}
          height={52}
          priority
          className="size-12 object-contain"
        />
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#d4f6d1] px-2.5 py-1 text-[9px] font-semibold text-[#035715]">
          <span aria-hidden="true">✓</span>
          Verified Industry Network
        </span>
        <h1 className="mt-2 text-[22px] font-bold tracking-[-0.03em] text-[#1b1b1d]">
          Welcome Back
        </h1>
        <p className="mt-1 text-[11px] text-[#625b71]">
          It&apos;s Good to have you here.
        </p>
      </div>

      <div className="mt-4">
        <AuthForm mode="login" />
      </div>
    </section>
  );
}
