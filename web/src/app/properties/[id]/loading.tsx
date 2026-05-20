import PageSpinner from "@/components/PageSpinner";

export default function PropertyLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Gallery skeleton */}
      <div className="flex flex-col lg:flex-row gap-3 lg:h-[500px] mb-8">
        <div className="h-64 sm:h-80 lg:h-full lg:w-[65%] lg:shrink-0 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="flex flex-row lg:flex-col gap-3 h-44 sm:h-56 lg:h-full lg:flex-1">
          <div className="flex-1 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="flex-1 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Content + sidebar */}
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="h-12 w-56 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="lg:w-[360px] lg:shrink-0">
          <PageSpinner label="Loading property..." />
        </div>
      </div>
    </div>
  );
}
