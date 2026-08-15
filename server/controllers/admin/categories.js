import Category from "../../models/category.js";

const NAME_MAX_LENGTH = 100;
const SLUG_MAX_LENGTH = 10;

export const listCategories = async (req, res, next) => {
  try{
    const categories = await Category.find().exec()
console.log(categories)
    return res.status(200).json({ok: true, message: categories})
  } catch(err) {
    next(err)
  }
}

export const createCategory = async (req, res, next) => {
  const {name, slug, catType, parent} = req.body
  try {

    if(!name || !catType) {
      return res.status(400).json({ok: false, message: "name and category type ares required"})
    }

    if(name.length > NAME_MAX_LENGTH) {
      return res.status(400).json({ok: false, message: "name must be less than 100 chatacters"})
    }

    if(slug.length > SLUG_MAX_LENGTH) {
      return res.status(400).json({ok: false, message: "slug must be less than 10 chatacters"})
    }

    const categoryData = {name,  type: catType}
    if(parent) categoryData.parent = parent
    if(slug) categoryData.slug = slug

    const category = await new Category(categoryData).save()
console.log(category)
    return res.status(201).json({ok: true, message: category});

  } catch(err) {console.log(err)
    if(err?.code === 11000) {
      return res.status(400).json({ok: false, message: "current cat exists"})
    }
    next(err)
  }
}