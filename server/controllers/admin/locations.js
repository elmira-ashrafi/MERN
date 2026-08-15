import mongoose, { isValidObjectId } from "mongoose"
import Country from "../../models/country.js"
import Province from "../../models/province.js"
import City from "../../models/city.js"

const NAME_MAX_LENGTH = 100;
const CODE_MAX_LENGTH = 10;

//the three models share the same shape apart from their parent reference
function readSharedFields(body) {
    return {
        name: typeof body.name === "string" ? body.name.trim() : "",
        code: typeof body.code === "string" ? body.code.trim().toUpperCase() : "",
        order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
        // anything but an explicit false means active
        isActive: body.isActive !== false && body.isActive !== "false"
    }
}

function validateSharedFields({name, code}) {
    if(!name) return "name is required";
    if(name.length > NAME_MAX_LENGTH) return `name must be at most ${NAME_MAX_LENGTH} characters`;
    if(!code) return "code is required";
    if(code.length > CODE_MAX_LENGTH) return `code must be at most ${CODE_MAX_LENGTH} characters`;
    return null;
}

//admin listings show inactive rows too, unlike the public ones used by the forms
const ADMIN_SORT = {order: 1, name: 1};

export const listCountries = async (req, res, next) => {
    try {
        const countries = await Country.find().sort(ADMIN_SORT).exec();
        return res.status(200).json({ok: true, message: countries});
    } catch(err) {
        return next(err);
    }
}

export const listProvinces = async (req, res, next) => {
    try {
        const { country } = req.query;
        const filter = {};

        if(country) {
            if(!mongoose.isValidObjectId(country)) {
                return res.status(400).json({ok: false, message: "invalid country"});
            }
            filter.country = country;
        }

        const provinces = await Province.find(filter).populate("country", "name").sort(ADMIN_SORT).exec();
        return res.status(200).json({ok: true, message: provinces});
    } catch(err) {
        return next(err);
    }
}

export const listCities = async (req, res, next) => {
    try {
        const { province } = req.query;
        const filter = {};

        if(province) {
            if(!mongoose.isValidObjectId(province)) {
                return res.status(400).json({ok: false, message: "invalid province"});
            }
            filter.province = province;
        }

        const cities = await City.find(filter).populate("province", "name").sort(ADMIN_SORT).exec();
        return res.status(200).json({ok: true, message: cities});
    } catch(err) {
        return next(err);
    }
}

export const createCountry = async (req, res, next) => {
    try {
        const fields = readSharedFields(req.body);

        const error = validateSharedFields(fields);
        if(error) return res.status(400).json({ok: false, message: error});

        const country = await new Country(fields).save();

        return res.status(201).json({ok: true, message: country});
    } catch(err) {
        if(err?.code === 11000) {
            return res.status(400).json({ok: false, message: "a country with this name or code already exists"});
        }
        return next(err);
    }
}

export const createProvince = async (req, res, next) => {
    try {
        const { country } = req.body;
        const fields = readSharedFields(req.body);

        const error = validateSharedFields(fields);
        if(error) return res.status(400).json({ok: false, message: error});

        if(!mongoose.isValidObjectId(country)) {
            return res.status(400).json({ok: false, message: "select a country"});
        }

        // the parent has to exist, the id comes straight from the browser
        const parent = await Country.findById(country).exec();
        if(!parent) return res.status(400).json({ok: false, message: "country not found"});

        const province = await new Province({...fields, country}).save();

        return res.status(201).json({ok: true, message: province});
    } catch(err) {
        if(err?.code === 11000) {
            return res.status(400).json({ok: false, message: "a province with this name or code already exists in that country"});
        }
        return next(err);
    }
}

export const createCity = async (req, res, next) => {
    try {
        const { province } = req.body;
        const fields = readSharedFields(req.body);

        const error = validateSharedFields(fields);
        if(error) return res.status(400).json({ok: false, message: error});

        if(!mongoose.isValidObjectId(province)) {
            return res.status(400).json({ok: false, message: "select a province"});
        }

        const parent = await Province.findById(province).exec();
        if(!parent) return res.status(400).json({ok: false, message: "province not found"});

        const city = await new City({...fields, province}).save();

        return res.status(201).json({ok: true, message: city});
    } catch(err) {
        if(err?.code === 11000) {
            return res.status(400).json({ok: false, message: "a city with this name or code already exists in that province"});
        }
        return next(err);
    }
}

export const updateCountry = async(req, res, next) => {
  try {

    const {id: _id} = req.params
    if(!mongoose.isValidObjectId(_id)) return res.status(400).json({ok: false, message: "not valid country id"})

    const countryData = readSharedFields(req.body)

    const error = validateSharedFields(countryData)
    if(error) return res.status(400).json({ok: false, message: error})

    const editingCountry = await Country.findOneAndUpdate({_id}, {...countryData}, {new: true, runValidators: true}).exec()
    if(!editingCountry) return res.status(404).json({ok: false, message: "country id not found"});

    return res.status(200).json({ok: true, message: editingCountry})

  } catch(err) {
    if(err?.code === 11000) {
      return res.status(400).json({ok: false, message: "country with this name or code already exists"})
    }
    return next(err)
  }
}

export const updateProvince = async (req, res, next) => {
  try {

    const {id: _id} = req.params;
    if(!mongoose.isValidObjectId(_id)) {
      return res.status(400).json({ok: false, message: "invalid province"})
    }

    const provinceDatas = readSharedFields(req.body);

    const error = validateSharedFields(provinceDatas);
    if(error) return res.status(400).json({ok: false, message: error})
      
    const {country} = req.body
    if(country) {
      if(!mongoose.isValidObjectId(country)) return res.status(400).json({ok: false, message: "invalid province country"})

      const countryObj = await Country.findById(country).exec()
      if(!countryObj) return res.status(400).json({ok: false, message: "province country not found"})

      provinceDatas.country = country
    }

    const editingProvince = await Province.findOneAndUpdate({_id}, {...provinceDatas}, {new: true, runValidators: true}).exec();
    if(!editingProvince) return res.status(404).json({ok: false, message: "province id not found"});

    return res.status(200).json({ok: true, message: editingProvince});

  } catch(err) {
    if(err?.code === 11000) {
      return res.status(400).json({ok: false, message: "province with same name or code exists"})
    }
    return next(err)
  }
}

export const updateCity = async (req, res, next) => {
  try {

    const {id: _id} = req.params
    if(!mongoose.isValidObjectId(_id)) {
      return res.status(400).json({ok: false, message: "invalid city"})
    }

    const cityFields = readSharedFields(req.body)

    const error = validateSharedFields(cityFields)
    if(error) return res.status(400).json({ok: false, message: error})

    const { province } = req.body
    if(province) {
      
      if(!mongoose.isValidObjectId(province)) {
        return res.status(400).json({ok: false, message: "invalid city's province"})
      }

      const cityProvince = await Province.findById(province).exec()
      if(!cityProvince) return res.status(404).json({ok: false, message: "city's province not found"})

      cityFields.province = province
    }

    const city = await City.findOneAndUpdate({_id}, cityFields, {new: true, runValidators: true}).exec()
    if(!city) return res.status(404).json({ok: false, message: "city not found"});

    return res.status(200).json({ok: true, message: city});

  } catch(err) {
    
    if(err?.code === 11000) {
      return res.status(400).json({ok: false, message: "city with the same name or code already exists!"})
    }

    next(err)
  }
}