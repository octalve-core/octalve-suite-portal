"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { useApp } from "../../AppContext";
import { ClientModalShell } from "./ClientModalShell";

export function ClientReviewModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { addReview } = useApp();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [permissionToPublish, setPermissionToPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitReview() {
    if (!comment.trim()) {
      setError("Please write a short review before submitting.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await addReview(project.id, rating, comment.trim(), permissionToPublish);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit review.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ClientModalShell title={`Review ${project.title}`} onClose={onClose}>
      <div className="grid gap-5">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <strong className="block text-sm font-semibold text-emerald-800">
            Project completed
          </strong>
          <p className="mt-1 text-sm font-medium leading-6 text-emerald-700">
            Share your experience with this completed project. Your feedback
            helps Octalve improve delivery quality.
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Rating</span>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRating(item)}
                disabled={loading}
                className={[
                  "rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                  rating === item
                    ? "border-[#0064E0] bg-blue-50 text-[#0064E0]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200",
                ].join(" ")}
              >
                {item} Star{item === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Review Comment
          </span>
          <textarea
            value={comment}
            disabled={loading}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell us what worked well and what could be improved."
            className="min-h-32 w-full resize-y rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0064E0] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          />
        </label>

        <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
          <input
            type="checkbox"
            checked={permissionToPublish}
            disabled={loading}
            onChange={(event) => setPermissionToPublish(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-[#0064E0]"
          />
          <span>
            I permit Octalve to publish this review as a testimonial.
            <small className="mt-1 block font-medium text-slate-500">
              Uncheck this if you want it kept as private feedback only.
            </small>
          </span>
        </label>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={submitReview}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0064E0] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(0,100,224,0.08)] transition hover:bg-[#0052B8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </ClientModalShell>
  );
}
