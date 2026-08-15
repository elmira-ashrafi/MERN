import { SyncOutlined } from "@ant-design/icons"

export default function CountrySelect({spinner, countries, currentCountery, onChange}) {

  return (<>
    {spinner && <SyncOutlined spin />}
    {!spinner && (
      <select className="p-2" value={currentCountery} onChange={onChange} name="country" id="country">
          <option value="">select a country</option>
          {countries.map(item => (
              <option key={item._id} value={item._id}>{item.name}{item.isActive ? '' : ' (inactive)'}</option>
          ))}
      </select>
    )}
  </>)
}