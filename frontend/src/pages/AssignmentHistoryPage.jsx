import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


// =========================================================
// PAGE
// =========================================================

export default function AssignmentHistoryPage() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);


  // =======================================================
  // LOAD ASSIGNMENTS
  // =======================================================

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/assignments`
      );

      if (!response.ok) {
        let message =
          `Failed to load assignments (${response.status})`;

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore invalid error response
        }

        throw new Error(message);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setAssignments(data);
      } else {
        setAssignments([]);
      }

    } catch (err) {
      console.error(
        "Failed to load assignment history:",
        err
      );

      setError(
        err?.message ||
          "Unable to load assignment history."
      );

    } finally {
      setIsLoading(false);
    }
  };


  // =======================================================
  // LOAD ON PAGE OPEN
  // =======================================================

  useEffect(() => {
    loadAssignments();
  }, []);


  // =======================================================
  // OPEN PDF
  // =======================================================

  const handleOpen = (id) => {
    if (!id) return;

    window.open(
      `${API_BASE_URL}/api/assignments/${id}/download`,
      "_blank",
      "noopener,noreferrer"
    );
  };


  // =======================================================
  // DOWNLOAD PDF
  // =======================================================

  const handleDownload = async (assignment) => {
    if (!assignment?.id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assignments/${assignment.id}/download`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to download the assignment."
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `${assignment.title || "InkAI_Assignment"}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(
        "Failed to download assignment:",
        err
      );

      setError(
        err?.message ||
          "Failed to download assignment."
      );
    }
  };


  // =======================================================
  // DELETE ASSIGNMENT
  // =======================================================

  const handleDelete = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?\n\nThe generated PDF will also be deleted."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/assignments/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        let message =
          "Failed to delete assignment.";

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore invalid response
        }

        throw new Error(message);
      }

      // Remove immediately from UI
      setAssignments((current) =>
        current.filter(
          (assignment) =>
            assignment.id !== id
        )
      );

    } catch (err) {
      console.error(
        "Failed to delete assignment:",
        err
      );

      setError(
        err?.message ||
          "Failed to delete assignment."
      );

    } finally {
      setDeletingId(null);
    }
  };


  // =======================================================
  // DATE FORMATTER
  // =======================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Unknown date";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <div className="flex items-center gap-3">

              <Link
                to="/"
                className="text-2xl font-bold tracking-tight text-white"
              >
                InkAI
              </Link>

              <span className="text-slate-600">
                /
              </span>

              <span className="text-lg font-medium text-slate-300">
                My Assignments
              </span>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              View and manage your generated assignments
            </p>
          </div>


          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={loadAssignments}
              disabled={isLoading}
              className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              to="/assignment"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              + New Assignment
            </Link>

          </div>

        </div>

      </header>


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-10">


        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold tracking-tight">
            My Assignments
          </h1>

          <p className="mt-2 text-slate-400">
            Your generated handwritten assignments are
            saved here.
          </p>

        </div>


        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4">

            <div>
              <p className="font-medium text-red-300">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-red-400">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 transition hover:text-red-200"
            >
              ✕
            </button>

          </div>
        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">

            <div className="text-center">

              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />

              <p className="text-sm text-slate-400">
                Loading your assignments...
              </p>

            </div>

          </div>
        )}


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!isLoading &&
          assignments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 px-6 py-20 text-center">

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 text-4xl">
                📚
              </div>

              <h2 className="text-xl font-semibold text-white">
                No assignments yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Your generated assignments will appear
                here after you create and generate a PDF.
              </p>

              <Link
                to="/assignment"
                className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Create Your First Assignment
              </Link>

            </div>
          )}


        {/* =================================================
            ASSIGNMENT GRID
        ================================================= */}

        {!isLoading &&
          assignments.length > 0 && (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {assignments.map((assignment) => (

                <div
                  key={assignment.id}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-indigo-500/30"
                >

                  {/* -----------------------------------------
                      CARD HEADER
                  ----------------------------------------- */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <h2 className="truncate text-lg font-semibold text-white">
                        {assignment.title ||
                          "Untitled Assignment"}
                      </h2>

                      <p className="mt-1 truncate text-sm text-slate-400">
                        {assignment.subject ||
                          "No subject"}
                      </p>

                    </div>


                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg">
                      📄
                    </div>

                  </div>


                  {/* -----------------------------------------
                      DETAILS
                  ----------------------------------------- */}

                  <div className="mt-6 space-y-3">

                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-slate-500">
                        Student
                      </span>

                      <span className="truncate text-right text-sm text-slate-300">
                        {assignment.student_name ||
                          "Not specified"}
                      </span>

                    </div>


                    {assignment.roll_number && (
                      <div className="flex items-center justify-between gap-4">

                        <span className="text-sm text-slate-500">
                          Roll Number
                        </span>

                        <span className="text-sm text-slate-300">
                          {assignment.roll_number}
                        </span>

                      </div>
                    )}


                    {assignment.class_name && (
                      <div className="flex items-center justify-between gap-4">

                        <span className="text-sm text-slate-500">
                          Class
                        </span>

                        <span className="text-sm text-slate-300">
                          {assignment.class_name}
                          {assignment.section
                            ? ` - ${assignment.section}`
                            : ""}
                        </span>

                      </div>
                    )}


                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-slate-500">
                        Pages
                      </span>

                      <span className="text-sm font-medium text-slate-300">
                        {assignment.page_count || 1}
                      </span>

                    </div>


                    <div className="flex items-center justify-between gap-4">

                      <span className="text-sm text-slate-500">
                        Created
                      </span>

                      <span className="text-sm text-slate-300">
                        {formatDate(
                          assignment.created_at
                        )}
                      </span>

                    </div>

                  </div>


                  {/* -----------------------------------------
                      STYLE TAGS
                  ----------------------------------------- */}

                  <div className="mt-5 flex flex-wrap gap-2">

                    {assignment.paper_style && (
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                        {assignment.paper_style}
                      </span>
                    )}

                    {assignment.handwriting_style && (
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                        {assignment.handwriting_style}
                      </span>
                    )}

                    {assignment.ink_color && (
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                        {assignment.ink_color} ink
                      </span>
                    )}

                  </div>


                  {/* -----------------------------------------
                      ACTIONS
                  ----------------------------------------- */}

                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">

                    <button
                      type="button"
                      onClick={() =>
                        handleOpen(
                          assignment.id
                        )
                      }
                      className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                    >
                      Open
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          assignment
                        )
                      }
                      className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                    >
                      Download
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          assignment.id
                        )
                      }
                      disabled={
                        deletingId ===
                        assignment.id
                      }
                      className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      assignment.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

      </main>

    </div>
  );
}