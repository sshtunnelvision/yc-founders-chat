"use client";

import { useState } from "react";
import cx from "classnames";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion, AnimatePresence } from "framer-motion";

interface FoundersQueryProps {
  question: string;
  sqlQuery: string;
  results: any;
  status: "executing" | "completed" | "error";
  error?: string;
}

// Add CSS styles for the skeleton animation
const skeletonStyles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.3;
    }
  }
  .skeleton-bg {
    position: relative;
  }
  .skeleton-div {
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  .skeleton-text {
    color: transparent !important;
    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background-color: rgba(148, 163, 184, 0.3);
    border-radius: 0.125rem;
  }
`;

// Loading skeleton component
function FoundersQuerySkeleton() {
  return (
    <div className="flex flex-col rounded-xl p-3 max-w-[800px] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg border border-slate-700/30">
      <style>{skeletonStyles}</style>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <div className="size-4 bg-blue-400/30 rounded-sm skeleton-div" />
          <div className="h-4 w-20 bg-blue-300/30 rounded-sm skeleton-div" />
        </div>
        <div className="h-4 w-12 bg-blue-300/30 rounded-sm skeleton-div" />
      </div>

      <div className="h-3 w-3/4 bg-gray-400/30 rounded-sm mb-2 skeleton-div" />

      <div className="flex flex-col gap-2">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="size-3 bg-gray-400/30 rounded-sm skeleton-div" />
            <div className="h-3 w-8 bg-gray-400/30 rounded-sm skeleton-div" />
          </div>
          <div className="h-24 bg-slate-900/50 rounded-md skeleton-div" />
        </div>
      </div>
    </div>
  );
}

export function FoundersQuery({
  question,
  sqlQuery,
  results,
  status,
  error,
}: FoundersQueryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Format SQL query for better readability
  const formattedSqlQuery = sqlQuery
    .replace(/SELECT/gi, "SELECT\n  ")
    .replace(/FROM/gi, "\nFROM\n  ")
    .replace(/WHERE/gi, "\nWHERE\n  ")
    .replace(/ORDER BY/gi, "\nORDER BY\n  ")
    .replace(/GROUP BY/gi, "\nGROUP BY\n  ")
    .replace(/HAVING/gi, "\nHAVING\n  ")
    .replace(/LIMIT/gi, "\nLIMIT ");

  // If we're in the executing state with no SQL query yet, show the skeleton
  if (status === "executing" && !sqlQuery) {
    return <FoundersQuerySkeleton />;
  }

  return (
    <div
      className={cx(
        "flex flex-col rounded-xl p-3 max-w-[800px] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg border border-slate-700/30",
        {
          "max-h-[500px]": !isExpanded,
        }
      )}
    >
      <style>{skeletonStyles}</style>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4 text-blue-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
              clipRule="evenodd"
            />
          </svg>
          <span
            className={cx("text-blue-300", {
              "skeleton-text": status === "executing",
            })}
          >
            YC Founders
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-300 hover:text-blue-100 transition-colors duration-200 flex items-center"
        >
          {isExpanded ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-3 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Expand
            </>
          )}
        </button>
      </div>

      <div
        className={cx("text-xs text-gray-400 italic mb-2", {
          "skeleton-text": status === "executing",
        })}
      >
        {question}
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <div className="text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className={cx({ "skeleton-text": status === "executing" })}>
              SQL
            </span>
          </div>
          <div className={cx({ "skeleton-div": status === "executing" })}>
            <SyntaxHighlighter
              language="sql"
              style={vscDarkPlus}
              className="rounded-md text-xs !p-2 !m-0"
              showLineNumbers={true}
              wrapLines={true}
              customStyle={{
                margin: 0,
                padding: "8px",
                fontSize: "0.75rem",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
              }}
            >
              {formattedSqlQuery}
            </SyntaxHighlighter>
          </div>
        </div>

        {status === "completed" && (
          <div className="mt-1">
            <button
              onClick={() => setShowResults(!showResults)}
              className="text-xs text-blue-300 hover:text-blue-100 transition-colors duration-200 flex items-center gap-1 mb-2"
            >
              {showResults ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Hide Results ({Array.isArray(results) ? results.length : 0}{" "}
                  rows)
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Show Results ({Array.isArray(results) ? results.length : 0}{" "}
                  rows)
                </>
              )}
            </button>

            {showResults && (
              <div className="overflow-x-auto bg-slate-900/30 rounded-md border border-slate-700/20">
                {Array.isArray(results) && results.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700/30 text-xs">
                    <thead>
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th
                            key={key}
                            className="px-2 py-1 text-left text-xs font-medium text-blue-300 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                      {results.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-slate-800/30 transition-colors duration-150"
                        >
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="px-2 py-1 text-xs">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-gray-400 p-2 text-center text-xs">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status === "executing" && sqlQuery && (
          <div className="text-blue-300 py-2 flex items-center justify-center text-xs">
            <svg
              className="animate-spin -ml-1 mr-2 size-3 text-blue-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Executing query...
          </div>
        )}

        {status === "error" && (
          <div className="text-red-400 p-2 bg-red-900/20 rounded-md text-xs">
            Error: {error || "An unknown error occurred"}
          </div>
        )}
      </div>
    </div>
  );
}
