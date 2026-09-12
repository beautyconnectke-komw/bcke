import Image from "next/image";
import { AuthForm } from "@/components/shared/auth-form";

export default function SignupPage() {
  return (
    <section className="w-full max-w-[390px]">
      <div className="rounded-2xl bg-[#f1eafa] px-5 py-4 text-center">
        <Image
          src="/logo/logo.png"
          alt="Beauty Connect"
          width={52}
          height={52}
          priority
          className="mx-auto size-12 object-contain"
        />
        <span className="mt-1 inline-flex rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-semibold text-[#6750a4]">
          Hey There
        </span>
        <h1 className="mt-2 text-[20px] font-bold tracking-[-0.03em] text-[#1b1b1d]">
          Create Your Account
        </h1>
        <p className="mx-auto mt-1 max-w-[280px] text-[10px] leading-4 text-[#625b71]">
          Create an account, confirm your email, then use the credentials that
          you signed up with to log in.
        </p>
      </div>

      <div className="mt-4">
        <AuthForm mode="signup" />
      </div>
    </section>
  );
}
