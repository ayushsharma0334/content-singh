import MainContent from "@/components/main-content";

export default function Home() {
  return (
    // Adjusted padding and background for consistency
    <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 bg-background">
      {/* MainContent now holds the Tabs for the core generation tools */}
      <MainContent />
    </main>
  );
}
