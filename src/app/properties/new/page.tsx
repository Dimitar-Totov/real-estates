import PropertyForm from "@/components/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Add Property</h1>
      <PropertyForm />
    </div>
  );
}
