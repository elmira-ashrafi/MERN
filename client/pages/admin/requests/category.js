import CategorySelect from "@/components/categories/CategorySelect";
import AdminOnly from "@/components/wrappers/admins/AdminOnly";
import AdminRoutes from "@/components/wrappers/admins/AdminRoutes";
import { apiFetch } from "@/lib/api";
import { handleFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SyncOutlined } from "@ant-design/icons";

export default function AdminCategories() {
  
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [catType, setCatType] = useState('')
  const [parent, setParent] = useState(null)
  const [isActiveState, setIsActiveState] = useState(true)
  const [categories, setCategories] = useState([])
  const [spinner, setSpinner] = useState(false)

  const loadCategories = () => {
    handleFetch(setSpinner, '/api/admin/categories', {}, 'failed to fetch categories list', setCategories)
  }

  useEffect(loadCategories, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setSpinner(true)

    try {
      
      const fetchConfig = {
        method: "POST",
        body: JSON.stringify({name, slug, catType, parent})  
      }

      const res = await apiFetch('/api/admin/categories', fetchConfig);

      const {ok, message} = await res.json()

      if(!ok || !res.ok) {
        toast.error(message) 
        return;
      }

      toast.success("category added successfully");
      loadCategories();
      
      setName('')
      setCode('')
      setCatType('')
      setParent('')

    } catch(err) {
      toast.error(err)
    }
    finally {
      setSpinner(false)
    }
  }
  
  return (
    <AdminOnly>
      <AdminRoutes>
        <form className="d-flex flex-column gap-2 border rounded-4 p-3 mt-3" onSubmit={handleSubmit}>
          <h5 className="mb-2">add new Category</h5>
          <div className="d-flex column-gap-4">
            <div className="d-flex w-50 flex-column row-gap-1">
              <label htmlFor="name">name</label>
              <input className="p-2" type="text" value={name} onChange={e=> setName(e.target.value)} name="name" id="name" placeholder="Laptop..." />
            </div>
            <div className="d-flex w-50 flex-column row-gap-1">
              <label htmlFor="code">slug</label>
              <input className="p-2" type="text" value={slug} onChange={e=> setSlug(e.target.value)} name="slug" id="slug" placeholder="LP" />
            </div>
          </div>
          <div className="d-flex column-gap-4 align-items-center">
            <div className="d-flex w-50 flex-column row-gap-1">
              <span>category type</span> 
              <select className="p-2" name="cat_type" id="cat_type" value={catType} onChange={e=> setCatType(e.target.value)}>
                <option value="">select category type</option>
                <option value="product">product</option>
                <option value="service">service</option>
              </select>
            </div>
            <div className="d-flex w-50 flex-column row-gap-1">
              <label className="w-50 d-flex align-items-center column-gap-2 pb-2" htmlFor="isActive">
                <input type="checkbox" checked={isActiveState} onChange={setIsActiveState} name="isActive" id="isActive" />
                <span>active <small className="text-muted">(inactive ones are hidden from users)</small></span>
              </label>
            </div>
          </div>
          <div className="d-flex flex-column row-gap-1">
            <span>parent</span>
            <CategorySelect spinner={spinner} categories={categories} parent={parent} onChange={(e) => setParent(e.target.value)}/>
          </div>
          <div className="w-25 mt-3">
            <button disabled={spinner} type="submit" className="btn btn-primary p-2 w-100">
              {spinner ? <SyncOutlined spin /> : "add category"}
            </button>
          </div>
        </form>
      </AdminRoutes>
    </AdminOnly>
  )
}