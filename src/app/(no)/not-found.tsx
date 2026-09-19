import Link from "next/link";
import { btnGhost } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-5 text-center">
      <div>
        <p className="text-sm font-medium text-mist-200">Fant ikke denne siden</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mist-400">
          Lenken kan være trukket tilbake, eller previewen kan være slettet.
        </p>
        <Link href="/" className={`${btnGhost} mt-5`}>
          Til forsiden
        </Link>
      </div>
    </main>
  );
}
