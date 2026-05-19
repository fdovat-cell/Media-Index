import { ReactNode } from "react";

export function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex justify-center w-full">
      <div className="w-full max-w-[430px] bg-background min-h-[100dvh] relative shadow-2xl overflow-x-clip md:border-x border-border flex flex-col">
        {children}
      </div>
    </div>
  );
}
