"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Search, Wand2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Columns to exclude from display
const EXCLUDED_COLUMNS = [
  "session_id",
  "page_id",
  "created_at",
  "updated_at",
  "raw_data",
];

export function DatabaseClient() {
  const [sqlQuery, setSqlQuery] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [results, setResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCell, setExpandedCell] = useState<{
    value: any;
    position: { x: number; y: number };
  } | null>(null);

  const handleQuerySubmit = async () => {
    if (!sqlQuery.trim()) {
      toast.error("Please enter a SQL query");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/database/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sqlQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute query");
      }

      const data = await response.json();

      // Filter out excluded columns from results
      const filteredResults = data.results.map((row: Record<string, any>) => {
        const filteredRow = { ...row };
        EXCLUDED_COLUMNS.forEach((col) => {
          delete filteredRow[col];
        });
        return filteredRow;
      });

      setResults(filteredResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Query execution failed", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSqlQuery = async () => {
    if (!naturalLanguageQuery.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/nl-to-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: naturalLanguageQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate SQL query");
      }

      const data = await response.json();
      setSqlQuery(data.sqlQuery);
      toast.success("SQL query generated", {
        description: "The query has been generated based on your question.",
      });
    } catch (err) {
      toast.error("Failed to generate SQL query", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!results || results.length === 0) return;

    try {
      // Get headers (excluding the filtered columns)
      const headers = Object.keys(results[0]);

      // Create CSV content
      const csvContent = [
        // Headers row
        headers.join(","),
        // Data rows
        ...results.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Handle null values, objects, and escape commas and quotes
              if (value === null) return "";
              if (typeof value === "object")
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              if (typeof value === "string")
                return `"${value.replace(/"/g, '""')}"`;
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "founders_query_results.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV file downloaded successfully");
    } catch (err) {
      toast.error("Failed to export CSV", {
        description: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  const showFullContent = (value: any, e: React.MouseEvent) => {
    // Only show full content on double-click
    if (e.detail !== 2) return;

    // Get position for the modal
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setExpandedCell({
      value,
      position: {
        x: rect.left,
        y: rect.top,
      },
    });

    // Prevent default behavior and propagation
    e.preventDefault();
    e.stopPropagation();
  };

  const closeExpandedCell = () => {
    setExpandedCell(null);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">YC Founders Database</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        Query the YC Founders database directly using SQL. The table name is{" "}
        <code>knowledge.founders</code>.
      </p>

      <div className="mb-6 bg-gray-50 dark:bg-zinc-900 p-3 rounded-md border border-gray-200 dark:border-zinc-800">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <div className="text-sm font-medium">Available Columns:</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">id</span>
            <span className="font-mono">name</span>
            <span className="font-mono">title</span>
            <span className="font-mono">company</span>
            <span className="font-mono">batch</span>
            <span className="font-mono">company_url</span>
            <span className="font-mono">description</span>
            <span className="font-mono">image_url</span>
            <span className="font-mono">linkedin_url</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Ask a Question</h2>
        </div>
        <div className="flex gap-2 mb-4">
          <Input
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            placeholder="e.g., Show me founders from the W21 batch"
            className="flex-1"
          />
          <Button
            onClick={generateSqlQuery}
            disabled={isGenerating}
            variant="secondary"
            className="gap-1 whitespace-nowrap"
          >
            {isGenerating ? "Generating..." : "Generate SQL"}
            {!isGenerating && <Wand2 className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">SQL Query</h2>
        <Textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="SELECT * FROM knowledge.founders LIMIT 10"
          className="font-mono h-32 mb-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleQuerySubmit}
            disabled={isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isLoading ? "Running..." : "Run Query"}
            {!isLoading && <Search className="ml-2 size-4" />}
          </Button>
          {results && results.length > 0 && (
            <Button onClick={exportToCSV} variant="outline" className="gap-1">
              <Download className="size-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {results && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Results</h2>
            <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
              {results.length} {results.length === 1 ? "row" : "rows"}
            </span>
          </div>
          <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 rounded-md shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
                  {results.length > 0 &&
                    Object.keys(results[0]).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300"
                      >
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {results.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {Object.values(row).map((value, colIndex) => {
                      const displayValue =
                        value === null ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : typeof value === "object" ? (
                          <span className="font-mono text-xs">
                            {JSON.stringify(value)}
                          </span>
                        ) : (
                          String(value)
                        );

                      const isLongText =
                        typeof value === "string" && value.length > 50;

                      return (
                        <td
                          key={colIndex}
                          className={`px-3 py-1.5 align-top ${
                            isLongText ? "cursor-pointer" : "whitespace-nowrap"
                          } overflow-hidden text-ellipsis max-w-[200px]`}
                          title={
                            typeof value === "string" ||
                            typeof value === "number"
                              ? String(value)
                              : undefined
                          }
                          onDoubleClick={(e) => showFullContent(value, e)}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded cell modal */}
      {expandedCell && (
        <div
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
          onClick={closeExpandedCell}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Cell Content</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeExpandedCell}
                className="p-1 h-auto"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="whitespace-pre-wrap break-words font-mono text-sm">
              {expandedCell.value === null ? (
                <span className="text-gray-400 italic">null</span>
              ) : typeof expandedCell.value === "object" ? (
                JSON.stringify(expandedCell.value, null, 2)
              ) : (
                String(expandedCell.value)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
