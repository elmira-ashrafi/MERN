import { SyncOutlined } from "@ant-design/icons"
import Link from "next/link"

export default function ProvinceSelect({spinner, onChange, country, provinces, currentProvince}) {
  return (<>
    {spinner && country && <SyncOutlined spin />}
    {!spinner && (
      <select className="p-2" value={currentProvince} onChange={onChange} name="province" id="province" disabled={!country}>
        <option value="">{country ? "select a province" : "select a country first"}</option>
        { provinces.map(item => (<option key={item._id} value={item._id}>{item.name}{item.isActive ? '' : ' (inactive)'}</option>)) }
      </select>
    )}
    {country && !spinner && provinces.length === 0 && (
      <small className="text-muted">this country has no province — <Link href="/admin/locations/provinces">add one</Link></small>
    )}
  </>)
}