import { WifiOff } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Offline | DropPR.ai",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 rounded-full bg-blue-50 p-6 text-blue-500">
        <WifiOff size={48} strokeWidth={1.5} />
      </div>
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        You are offline
      </h1>
      <p className="mb-8 max-w-md text-lg text-gray-600">
        It looks like you've lost your internet connection. Please check your network and try again.
      </p>
      <Link
        href="/"
        className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Try Again
      </Link>
    </div>
  );
}
