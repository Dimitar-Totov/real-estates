"use client";

import { useState } from "react";

export default function InquiryForm({ propertyId }: { propertyId: number }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!res.ok) throw new Error("Failed to send inquiry");
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-lg">Contact Agent</h2>

      {success ? (
        <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
          Inquiry sent! We will be in touch soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <InputField label="Name" name="name" required />
          <InputField label="Email" name="email" type="email" required />
          <InputField label="Phone" name="phone" type="tel" />

          <label className="block space-y-1">
            <span className="text-sm font-medium">
              Message<span className="text-red-500 ml-0.5">*</span>
            </span>
            <textarea
              name="message"
              rows={4}
              required
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Inquiry"}
          </button>
        </form>
      )}
    </div>
  );
}

function InputField({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}
