import { Logo } from "./Logo";

// Header brand yang sama dipakai di login/register/lupa-password/reset-password.
export function AuthHeader() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <Logo className="h-12 w-12" />
      <h1 className="mt-3 text-2xl font-bold text-brand-600">Warung.io</h1>
      <p className="mt-1 text-sm text-gray-500">Catat jualan, tahu untung.</p>
    </div>
  );
}
