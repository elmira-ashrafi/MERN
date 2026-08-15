import { SyncOutlined } from "@ant-design/icons"

export default function CategorySelect({spinner, categories, currentCategory, onChange}) {

  return (<>
    {spinner && <SyncOutlined spin />}
    {!spinner && (
      <select className="p-2" value={currentCategory} onChange={onChange} name="country" id="country">
          <option value="">select a category</option>
          {categories.map(item => (
              <option key={item._id} value={item._id}>{item.name}{item.isActive ? '' : ' (inactive)'}</option>
          ))}
      </select>
    )}
  </>)
}