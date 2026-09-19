import HomePage from "@/components/site/HomePage";
import { loadContent } from "@/lib/site/load";

// Teksten kan endres av admin; sida bygges på nytt når det skjer
// (revalidatePath i /api/site-text), ellers holder den seg statisk.
export const revalidate = 3600;

export default async function Page() {
  return <HomePage content={await loadContent("nb")} />;
}
