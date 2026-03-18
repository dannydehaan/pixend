import CollectionSidebar from "./CollectionSidebar";
import TopNav from "./TopNav";
import HeroSection from "./HeroSection";
import RequestCatalog from "./RequestCatalog";
import DocsFooter from "./DocsFooter";
import InfoSidebar from "./InfoSidebar";

const CollectionOverview = () => (
  <div
    data-testid="collection-overview"
    className="flex h-screen overflow-hidden bg-background text-on-background font-body"
  >
    <CollectionSidebar />
    <main className="flex-1 flex flex-col h-full bg-surface overflow-y-auto">
      <TopNav />
      <HeroSection />
      <div className="flex flex-1 w-full">
        <div className="flex-1">
          <RequestCatalog />
          <div className="px-8">
            <DocsFooter />
          </div>
        </div>
        <InfoSidebar />
      </div>
    </main>
  </div>
);

export default CollectionOverview;
