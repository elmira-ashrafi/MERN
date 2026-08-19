import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { handleFetch } from "@/lib/api";
import { getErrorMessage } from "@/lib/strings";

const MAX_FILES = 5;
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const GLOBAL_FETCH_FAILURE_MSG = "something went wrong! check your network connectivity";

/*
 * Shared state/logic behind the "submit request" and "edit request" forms — they only differ
 * in their initial values and in where the built FormData gets sent.
 */
export function useRequestForm({
  initialTitle = '',
  initialDescription = '',
  initialImages = [],
  initialCategoryId = '',
  initialCategoryName = '',
  initialLocationSource = 'default',
  initialCountry = '',
  initialProvince = '',
  initialCity = '',
  profileLocation = null,
  profileLocationReady = true,
  submitRequest,
}) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [requestTitle, setRequestTitle] = useState(initialTitle);
  const [requestDesc, setRequestDesc] = useState(initialDescription);
  const [requestImages, setRequestImages] = useState(initialImages);
  const [requestCategory, setRequestCategory] = useState(initialCategoryId);
  const [requestCategoryName, setRequestCategoryName] = useState(initialCategoryName);
  const [showCats, setShowCats] = useState(false);
  const [catsSpinner, setCatsSpinner] = useState(false);
  const [existingCats, setExistingCats] = useState([]);

  const [requestLocationSource, setRequestLocationSourceState] = useState(initialLocationSource);

  // if the profile location is already sitting in context at mount time (e.g. arriving via
  // client-side nav from a page that already loaded it), seed straight from it
  const seedFromProfile = field => initialLocationSource === 'default' && profileLocation ? profileLocation[field] : '';

  const [requestCountry, setRequestCountry] = useState(initialCountry || seedFromProfile('country'));
  const [existingCountries, setExistingCountries] = useState([]);
  const [existingCountriesSpinner, setExistingCountriesSpinner] = useState(false);
  const [requestProvince, setRequestProvince] = useState(initialProvince || seedFromProfile('province'));
  const [existingProvinces, setExistingProvinces] = useState([]);
  const [existingProvincesSpinner, setExistingProvincesSpinner] = useState(false);
  const [requestCity, setRequestCity] = useState(initialCity || seedFromProfile('city'));
  const [existingCities, setExistingCities] = useState([]);
  const [existingCitiesSpinner, setExistingCitiesSpinner] = useState(false);

  const [btnSpinner, setBtnSpinner] = useState(false);

  const isCustomLocation = requestLocationSource === 'custom';

  // switching to "my current location" pulls from the profile; switching to "custom" keeps whatever is selected
  const setRequestLocationSource = value => {
    setRequestLocationSourceState(value);

    if(value === 'default' && profileLocation) {
      setRequestCountry(profileLocation.country);
      setRequestProvince(profileLocation.province);
      setRequestCity(profileLocation.city);
    }
  }

  /*
   * The profile location can also change out from under this form (context resolves it async
   * on first load). React's documented way to resync state with a changed value is to compare
   * against the previous one during render, not in an effect — an effect would setState after
   * commit and cause a visible extra render.
   */
  const [prevProfileLocation, setPrevProfileLocation] = useState(profileLocation);

  if(requestLocationSource === 'default' && profileLocation !== prevProfileLocation) {
    setPrevProfileLocation(profileLocation);

    if(profileLocation) {
      setRequestCountry(profileLocation.country);
      setRequestProvince(profileLocation.province);
      setRequestCity(profileLocation.city);
    }
  }

  // a request needs a location on the profile, so send the user there first — but not before we
  // actually know whether the profile has one (profileLocation is also null while still loading)
  useEffect(() => {
    if(!profileLocationReady) return;

    if(requestLocationSource === 'default' && !profileLocation) {
      toast.error("in order to submit a request, you should submit your location first.");
      router.replace('/dashboard/edit-profile?location=false');
    }
  }, [requestLocationSource, profileLocation, profileLocationReady, router])

  //the country list is only needed once the user asks for a custom location
  useEffect(() => {
    if(!isCustomLocation || existingCountries.length) return;

    handleFetch(setExistingCountriesSpinner, '/api/get-countries', {}, GLOBAL_FETCH_FAILURE_MSG, setExistingCountries)
  }, [isCustomLocation, existingCountries.length])

  //fetch existing provinces based on user selected country
  useEffect(() => {
    if(!isCustomLocation || !requestCountry) return;

    handleFetch(setExistingProvincesSpinner, `/api/get-provinces/${requestCountry}`, {}, GLOBAL_FETCH_FAILURE_MSG, setExistingProvinces)
  }, [requestCountry, isCustomLocation]);

  //fetch existing cities based on user selected province
  useEffect(() => {
    if(!isCustomLocation || !requestProvince) return;

    handleFetch(setExistingCitiesSpinner, `/api/get-cities/${requestProvince}`, {}, GLOBAL_FETCH_FAILURE_MSG, setExistingCities)
  }, [requestProvince, isCustomLocation])

  const handleCountryChange = value => {
    setRequestCountry(value);
    setRequestProvince('');
    setRequestCity('');
    setExistingProvinces([]);
    setExistingCities([]);
  }

  const handleProvinceChange = value => {
    setRequestProvince(value);
    setRequestCity('');
    setExistingCities([]);
  }

  /*
   * The unmount cleanup runs with the closure it was created in, so it has to read the
   * images through a ref — with an empty dependency array it would see the initial [].
   */
  const requestImagesRef = useRef([]);

  useEffect(() => {
    requestImagesRef.current = requestImages;
  }, [requestImages])

  useEffect(() => {
    return () => {
      requestImagesRef.current.forEach(img => img.file && URL.revokeObjectURL(img.preview));
    }
  }, [])

  //handle categories
  const handleCatsOpen = () => {
    setShowCats(true)
    if(existingCats.length === 0) handleFetch(setCatsSpinner, '/api/get-cats', {}, GLOBAL_FETCH_FAILURE_MSG, setExistingCats)
  }

  //set product category on selection
  const selectCat = (e, cat) => {
    e.preventDefault();
    setRequestCategoryName(`${cat.name} - ${cat.type}`);
    setRequestCategory(cat._id);
    setShowCats(false);
    inputRef.current?.blur()
  }

  //handle selected images for request
  const handleReuqestImages = e => {
    const selectedFiles = Array.from(e.target.files || []);

    if(!selectedFiles.length) return

    let unAllowed = selectedFiles.findIndex(img => !ALLOWED_MIMES.includes(img.type))
    if(unAllowed !== -1) {
      toast.error("only jpg, jpeg, png and webp are allowed");
      e.target.value = ""
      return
    }

    setRequestImages(prev => {
      const remainingSlots = MAX_FILES - prev.length

      if(remainingSlots <= 0) {
        toast.error('maximum 5 images are allowed');
        return prev;
      }

      if(selectedFiles.length > remainingSlots) {
        toast.error('maximum 5 images are allowed');
      }

      const allowedFiles = selectedFiles.slice(0, remainingSlots);

      const newItems = allowedFiles.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        alt: file.name,
        preview: URL.createObjectURL(file)
      }))

      return [...prev, ...newItems];
    })

    e.target.value = "";
  }

  //release image preview url and remove image itself
  const removeImage = (e, id) => {
    setRequestImages(prev => {
      const itemToRemove = prev.find(image => image.id === id)

      if(itemToRemove?.file) {
        URL.revokeObjectURL(itemToRemove.preview)
      }

      return prev.filter(image => image.id !== id);
    })
  }

  //handle user request
  const handleUserRequest = async e => {
    e.preventDefault();
    setBtnSpinner(true)

    const formData = new FormData();

    // the requester is taken from the auth cookie on the server, never sent from here
    formData.append('requestTitle', requestTitle);
    formData.append('requestDesc', requestDesc);
    formData.append('category', requestCategory);
    formData.append('requestLocationSource', requestLocationSource);
    formData.append('requestCountry', requestCountry);
    formData.append('requestProvince', requestProvince);
    formData.append('requestCity', requestCity);

    // new picks carry a real File; images already on the request only carry their id
    requestImages.filter(img => img.file).forEach(img => formData.append('requestImages', img.file));
    requestImages.filter(img => !img.file).forEach(img => formData.append('existingImages', img.id));

    try {
      const res = await submitRequest(formData);
      const {ok, message} = await res.json();

      if(!res.ok || !ok) {
        toast.error(message)
        return;
      }

      requestImages.forEach(img => img.file && URL.revokeObjectURL(img.preview));

      router.replace('/dashboard/my-requests/' + message);

    } catch(err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBtnSpinner(false);
    }
  }

  return {
    inputRef,
    requestTitle, setRequestTitle,
    requestDesc, setRequestDesc,
    requestImages, handleReuqestImages, removeImage,
    requestCategory, requestCategoryName, showCats, closeCats: () => setShowCats(false), catsSpinner, existingCats, handleCatsOpen, selectCat,
    requestLocationSource, setRequestLocationSource, isCustomLocation,
    requestCountry, handleCountryChange, existingCountries, existingCountriesSpinner,
    requestProvince, handleProvinceChange, existingProvinces, existingProvincesSpinner,
    requestCity, setRequestCity, existingCities, existingCitiesSpinner,
    btnSpinner, handleUserRequest,
  };
}
