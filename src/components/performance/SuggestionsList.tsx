interface SuggestionsListProps {
  suggestions: string[];
  title?: string;
}

export default function SuggestionsList({
  suggestions,
  title = 'Recommended Actions',
}: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="bg-blue-50 rounded-lg border border-blue-200 p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          {title}
        </h2>
      </header>

      <ul className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            <p className="text-blue-900 flex-1 pt-0.5">{suggestion}</p>
          </li>
        ))}
      </ul>

      <footer className="mt-4 pt-4 border-t border-blue-300">
        <p className="text-sm text-blue-800 italic">
          💡 These suggestions are based on your current performance patterns.
          Following them consistently can help improve your O/L results.
        </p>
      </footer>
    </section>
  );
}
