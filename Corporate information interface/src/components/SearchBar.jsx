function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="max-w-md mx-auto mb-8">

      <input
        type="text"
        placeholder="Search company, city, or technology..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
      />

    </div>
  );
}

export default SearchBar;