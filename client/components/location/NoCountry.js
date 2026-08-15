export default function NoCountry(spinner, countryList) {
  return (<>
    {!spinner
    && countryList.length === 0 
    && (
      <p className="text-muted mt-3">
        add a country first — 
        <Link href="/admin/locations/countries">
          go to countries
        </Link>
      </p>
      )
    }
  </>)
}