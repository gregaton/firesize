import FirestoreSizer from "@/components/firestore-sizer";
import { SquareSigmaIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8 md:mb-12">
        <div className="inline-flex items-center gap-4">
          <SquareSigmaIcon className="h-10 w-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">
            Firesize
          </h1>
        </div>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Estimate the size of your Firestore documents to optimize your database schema and avoid hitting the 1 MiB limit.
        </p>
      </header>

      <FirestoreSizer />
    </main>
  );
}
