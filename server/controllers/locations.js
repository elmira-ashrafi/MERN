import Country from "../models/country.js"
import Province from "../models/province.js"
import City from "../models/city.js"
import mongoose from "mongoose"

// order first so an admin can pin common entries to the top, then alphabetical
const LOCATION_SORT = {order: 1, name: 1};

export const getCountries = async (req, res, next) => {
    try {
        const countries = await Country.find({isActive: true}).select("_id name").sort(LOCATION_SORT).exec()

        // an empty list is a valid answer, not a server error
        return res.status(200).json({ok: true, message: countries});
    } catch(err) {
        return next(err);
    }
}

export const getProvinces = async (req, res, next) => {
    try {
        const { countryId } = req.params;

        if(!mongoose.isValidObjectId(countryId)) return res.status(400).json({ok: false, message: "invalid country id"});

        const submitedCountry = await Country.find({_id: countryId}).exec();

        if(!submitedCountry) res.status(404).json({ok: false, message: "country not found"});

        const userCountryProvinces = await Province.find({country: countryId, isActive: true}).select("_id name").sort(LOCATION_SORT).exec();

        if(!userCountryProvinces) return res.status(404).json({ok: false, message: "no province found for this country"});

        return res.status(200).json({ok: true, message: userCountryProvinces});

    } catch(err) {
        return next(err);
    }
}

export const getCities = async (req, res, next) => {
    try {
        const { provinceId } = req.params

        if(!mongoose.isValidObjectId(provinceId)) return res.status(400).json({ok: false, message: "invalid province id"});

        const submitedProvince = await Province.find({_id: provinceId}).exec();

        if(!submitedProvince) return res.status(404).json({ok: false, message: "province not found"});

        const cities = await City.find({province: provinceId, isActive: true}).select('_id name').sort(LOCATION_SORT).exec();

        if(!cities) return res.status(404).json({ok: false, message: "no cities found for this province"});

        return res.status(200).json({ok: true, message: cities});

    } catch(err) {
        return next(err);
    }
}
