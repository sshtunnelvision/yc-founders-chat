"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Download,
  Search,
  Wand2,
  X,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Columns to exclude from display
const EXCLUDED_COLUMNS = [
  "session_id",
  "page_id",
  "created_at",
  "updated_at",
  "raw_data",
];

// Local storage keys
const STORAGE_KEYS = {
  SQL_QUERY: "yc_founders_sql_query",
  NL_QUERY: "yc_founders_nl_query",
  RESULTS: "yc_founders_results",
};

// Example queries
const EXAMPLE_QUERIES = [
  {
    title: "Founders who went to Stanford",
    description: "Find all founders who attended Stanford University",
    query: `SELECT f.name, f.company, f.batch 
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(l.education::jsonb) edu
  WHERE edu->>'school_name' ILIKE '%Stanford%'
)
LIMIT 100;`,
  },
  {
    title: "Founders who worked at Google",
    description: "Find founders with Google experience",
    query: `SELECT f.name, f.company, f.batch 
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(l.experience::jsonb) exp
  WHERE exp->>'company_name' ILIKE '%Google%'
)
LIMIT 50;`,
  },
  {
    title: "Top universities by founder count",
    description: "Count how many founders attended each university",
    query: `SELECT edu->>'school_name' as university, COUNT(DISTINCT f.id) as founder_count
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id,
jsonb_array_elements(l.education::jsonb) edu
WHERE edu->>'school_name' IS NOT NULL
GROUP BY university
ORDER BY founder_count DESC
LIMIT 20;`,
  },
  {
    title: "Founders with AI/ML skills",
    description: "Find founders with AI or machine learning skills",
    query: `SELECT f.name, f.company, f.batch, l.skills
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE l.skills::text ILIKE '%machine learning%' 
   OR l.skills::text ILIKE '%artificial intelligence%'
   OR l.skills::text ILIKE '%deep learning%'
LIMIT 50;`,
  },
  {
    title: "Founders by location",
    description: "Group founders by their LinkedIn location",
    query: `SELECT l.location, COUNT(*) as founder_count
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE l.location IS NOT NULL
GROUP BY l.location
ORDER BY founder_count DESC
LIMIT 20;`,
  },
  {
    title: "Recent YC batches",
    description: "Find founders from recent YC batches",
    query: `SELECT f.batch, COUNT(*) as founder_count
FROM knowledge.founders f
WHERE f.batch SIMILAR TO '(W|S)2[2-3]'
GROUP BY f.batch
ORDER BY f.batch DESC;`,
  },
  {
    title: "Founders with technical backgrounds",
    description: "Find founders with technical education or experience",
    query: `SELECT DISTINCT f.name, f.company, f.batch
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(l.education::jsonb) edu
  WHERE edu->>'field_of_study' ILIKE ANY(ARRAY['%computer%', '%engineering%', '%physics%', '%mathematics%'])
)
OR l.headline ILIKE ANY(ARRAY['%engineer%', '%developer%', '%programmer%', '%technical%'])
LIMIT 50;`,
  },
  {
    title: "Founders with entrepreneurial experience",
    description: "Find founders who were previously founders or CEOs",
    query: `SELECT f.name, f.company, f.batch
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(l.experience::jsonb) exp
  WHERE exp->>'title' ILIKE ANY(ARRAY['%founder%', '%co-founder%', '%ceo%', '%chief executive%'])
)
LIMIT 50;`,
  },
  {
    title: "Founders with Ivy League education",
    description: "Find founders who attended Ivy League schools",
    query: `SELECT f.name, f.company, f.batch, edu->>'school_name' as university
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id,
jsonb_array_elements(l.education::jsonb) edu
WHERE edu->>'school_name' ILIKE ANY(ARRAY[
  '%Harvard%', '%Yale%', '%Princeton%', '%Columbia%', 
  '%Brown%', '%Dartmouth%', '%Cornell%', '%Pennsylvania%'
])
LIMIT 100;`,
  },
  {
    title: "Founders with international experience",
    description: "Find founders with work experience outside the US",
    query: `SELECT DISTINCT f.name, f.company, f.batch
FROM knowledge.founders f 
JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(l.experience::jsonb) exp
  WHERE exp->>'location' NOT ILIKE '%United States%'
    AND exp->>'location' NOT ILIKE '%USA%'
    AND exp->>'location' IS NOT NULL
)
LIMIT 50;`,
  },
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
  const [examplesDialogOpen, setExamplesDialogOpen] = useState(false);
  const [copiedQueryIndex, setCopiedQueryIndex] = useState<number | null>(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    try {
      // Load SQL query
      const savedSqlQuery = localStorage.getItem(STORAGE_KEYS.SQL_QUERY);
      if (savedSqlQuery) setSqlQuery(savedSqlQuery);

      // Load natural language query
      const savedNlQuery = localStorage.getItem(STORAGE_KEYS.NL_QUERY);
      if (savedNlQuery) setNaturalLanguageQuery(savedNlQuery);

      // Load results
      const savedResults = localStorage.getItem(STORAGE_KEYS.RESULTS);
      if (savedResults) {
        try {
          setResults(JSON.parse(savedResults));
        } catch (e) {
          console.error("Failed to parse saved results:", e);
          // Clear invalid results
          localStorage.removeItem(STORAGE_KEYS.RESULTS);
        }
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
  }, []);

  // Save SQL query to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.SQL_QUERY, sqlQuery);
    } catch (e) {
      console.error("Error saving SQL query to localStorage:", e);
    }
  }, [sqlQuery]);

  // Save natural language query to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.NL_QUERY, naturalLanguageQuery);
    } catch (e) {
      console.error("Error saving NL query to localStorage:", e);
    }
  }, [naturalLanguageQuery]);

  // Save results to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined" || results === null) return;
    try {
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    } catch (e) {
      console.error("Error saving results to localStorage:", e);
    }
  }, [results]);

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

  // Function to clear cached data
  const clearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SQL_QUERY);
      localStorage.removeItem(STORAGE_KEYS.NL_QUERY);
      localStorage.removeItem(STORAGE_KEYS.RESULTS);

      setSqlQuery("");
      setNaturalLanguageQuery("");
      setResults(null);

      toast.success("Cache cleared successfully");
    } catch (e) {
      toast.error("Failed to clear cache");
      console.error("Error clearing cache:", e);
    }
  };

  // Function to run an example query
  const runExampleQuery = (query: string) => {
    setSqlQuery(query);
    setExamplesDialogOpen(false);
    // Automatically run the query after a short delay to allow the UI to update
    setTimeout(() => {
      handleQuerySubmit();
    }, 100);
  };

  // Function to copy an example query to clipboard
  const copyExampleQuery = (query: string, index: number) => {
    navigator.clipboard.writeText(query);
    setCopiedQueryIndex(index);
    toast.success("Query copied to clipboard");

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedQueryIndex(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">YC Founders Database</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={clearCache}
          className="text-xs"
        >
          Clear Cache
        </Button>
      </div>
      <p className="mb-2 text-sm text-muted-foreground">
        Query the YC Founders database directly using SQL. The main table name
        is <code>knowledge.founders</code> and the LinkedIn data table is{" "}
        <code>knowledge.founder_linkedin_data</code>.
      </p>

      <div className="mb-6 bg-gray-50 dark:bg-zinc-900 p-3 rounded-md border border-gray-200 dark:border-zinc-800">
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-2">
          <div className="text-sm font-medium">Founders Table Columns:</div>
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
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <div className="text-sm font-medium">
            LinkedIn Data Table Columns:
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-mono">id</span>
            <span className="font-mono">founder_id</span>
            <span className="font-mono">headline</span>
            <span className="font-mono">location</span>
            <span className="font-mono">experience</span>
            <span className="font-mono">education</span>
            <span className="font-mono">skills</span>
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
            placeholder="e.g., Show me founders from the W21 batch with their LinkedIn skills"
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
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">SQL Query</h2>
        </div>
        <Textarea
          value={sqlQuery}
          onChange={(e) => setSqlQuery(e.target.value)}
          placeholder="SELECT f.name, f.company, f.batch, l.headline, l.skills 
FROM knowledge.founders f 
LEFT JOIN knowledge.founder_linkedin_data l ON f.id = l.founder_id 
LIMIT 10"
          className="font-mono h-32 mb-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <Dialog
            open={examplesDialogOpen}
            onOpenChange={setExamplesDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Lightbulb className="size-4" />
                Example Queries
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Example Queries</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                {EXAMPLE_QUERIES.map((example, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-zinc-800 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium">{example.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        onClick={() => copyExampleQuery(example.query, index)}
                      >
                        {copiedQueryIndex === index ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {example.description}
                    </p>
                    <pre className="text-xs bg-gray-100 dark:bg-zinc-800 p-2 rounded overflow-x-auto">
                      {example.query}
                    </pre>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
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

      <p className="text-[10px] text-gray-400 text-center mt-8">
        Not affiliated with Y Combinator or any of its subsidiaries.
      </p>
    </div>
  );
}
