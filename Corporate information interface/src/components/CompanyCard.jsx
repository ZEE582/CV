function CompanyCard({ company }) {

  const stackCategories = company.tech_stack?.tech_stack || [];

  const getCompanyLogo = () => {
    if (company.company_logo) return company.company_logo;

    if (!company.website) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(company.company_name)}`;
    }

    const domain = company.website
      .replace(/^https?:\/\/(www\.)?/, "")
      .split("/")[0];

    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition">

      <div className="flex gap-4 mb-4">

        <img
          src={getCompanyLogo()}
          className="w-14 h-14 rounded-xl bg-gray-100 p-1"
        />

        <div>
          <h3 className="font-bold text-lg">
            {company.company_name}
          </h3>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              className="text-indigo-500 text-sm"
            >
              {company.website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          )}

          <p className="text-xs text-gray-500">
            {company.city}
          </p>
        </div>

      </div>

      <div className="space-y-3">

        {stackCategories.map((category) => {

          const techs = company.tech_stack?.[category] || [];

          if (techs.length === 0) return null;

          return (
            <div key={category}>

              <span className="text-xs font-bold text-indigo-600 uppercase">
                {category}
              </span>

              <div className="flex flex-wrap gap-1 mt-1">

                {techs.map((tech) => (
                  <span
                    key={tech.name}
                    className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {tech.icon && (
                      <img src={tech.icon} className="w-3 h-3" />
                    )}
                    {tech.name}
                  </span>
                ))}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default CompanyCard;