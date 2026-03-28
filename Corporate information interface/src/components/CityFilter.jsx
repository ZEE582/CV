function CityFilter({ cities, selectedCity, setSelectedCity }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">

      {cities.map((city) => (
        <button
          key={city}
          onClick={() => setSelectedCity(city)}
          className={`px-5 py-2 rounded-full text-sm border transition
          ${
            selectedCity === city
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50"
          }`}
        >
          {city}
        </button>
      ))}

    </div>
  );
}

export default CityFilter;