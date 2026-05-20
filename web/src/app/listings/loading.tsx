import PageSpinner from "@/components/PageSpinner";

export default function ListingsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="h-9 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Filters sidebar skeleton */}
        <aside className="w-full md:w-72 shrink-0 space-y-3">
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        </aside>

        {/* Cards grid skeleton */}
        <section className="flex-1 min-w-0">
          <PageSpinner label="Loading listings..." />
        </section>
      </div>
    </div>
  );
}
