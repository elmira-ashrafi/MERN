import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout";
import { Context } from "@/context";
import { handleFetch } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import { SyncOutlined } from "@ant-design/icons";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

const EditProfile = () => {

    //get user data from Context
    const {state: {user, authReady}, dispatch} = useContext(Context);
    const location = user?.requesterProfile?.location;

    //show popup if location=false param is set
    const router = useRouter();
    const popupRef = useRef(false)

    //prepare demanded states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userCountry, setUserCountry] = useState(location?.country || '');
    const [existingCountries, setExistingCountries] = useState([]);
    const [existingCountriesSpinner, setExistingCountriesSpinner] = useState(false);
    const [userProvince, setUserProvince] = useState(location?.province || '');
    const [existingProvinces, setExistingProvinces] = useState([]);
    const [existingProvincesSpinner, setExistingProvincesSpinner] = useState(false);
    const [userCity, setUserCity] = useState(location?.city || '');
    const [existingCities, setExistingCities] = useState([]);
    const [existingCitiesSpinner, setExistingCitiesSpinner] = useState(false);
    const [phone, setPhone] = useState('');
    const [btnSpinner, setBtnSpinner] = useState(false);
    const globalFetchFailureMsg = "something went wrong! check your network connectivity";

    useEffect(()=> {
        if(!router.isReady) return
        const { location } = router.query
        if(location === 'false' && popupRef.current === false) {
            popupRef.current = true;
            toast.info('add your location in order to add request');
        }
    }, [router.isReady, router.query])

    /*
     * Fill the form from the context user. React's documented way to resync state with a
     * changed value is to compare against the previous one during render — in an effect this
     * would render the whole form a second time every time the session refreshes.
     */
    const [seededUser, setSeededUser] = useState(null);

    if(user && user !== seededUser) {
        setSeededUser(user);
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phoneNumber || '');
        setUserCountry(location?.country || '');
        setUserProvince(location?.province || '');
        setUserCity(location?.city || '');
    }

    //fetch existing countries
    useEffect(()=> {
        handleFetch(setExistingCountriesSpinner, '/api/get-countries', {}, globalFetchFailureMsg, setExistingCountries)
    }, [])

    //fetch existing provinces based on user selected country
    useEffect( () => {

        if(!userCountry) return

        handleFetch(setExistingProvincesSpinner, `/api/get-provinces/${userCountry}`, {}, globalFetchFailureMsg, setExistingProvinces)

    }, [userCountry]);

    //fetch existing cities based on user selected province
    useEffect(()=> {

        if(!userProvince) return

        handleFetch(setExistingCitiesSpinner, `/api/get-cities/${userProvince}`, {}, globalFetchFailureMsg, setExistingCities)

    }, [userProvince])

    /*
     * The dependent fields are cleared by the action that invalidates them rather than by an
     * effect watching the value — an effect would setState synchronously on every change.
     */
    const handleCountryChange = value => {
        setUserCountry(value);
        setUserProvince('');
        setUserCity('');
        setExistingProvinces([]);
        setExistingCities([]);
    }

    const handleProvinceChange = value => {
        setUserProvince(value);
        setUserCity('');
        setExistingCities([]);
    }

    //send profile datas to backend
    const handleProfileData = async e => {
        e.preventDefault();
        setBtnSpinner(true);

        try {
            // the account being edited is taken from the auth cookie, not from anything sent here
            let fetchConfig = {
                method: "POST",
                body: JSON.stringify({name, email, currentPassword, password, confirmPassword, phone, userCountry, userProvince, userCity})
            }

            const res = await apiFetch('/api/edit-profile', fetchConfig);
            const {ok, message, user: updatedUser} = await res.json();

            if(!res.ok || !ok || typeof updatedUser !== "object") {
                toast.error(message)
            } else {
                toast.success(message);
                dispatch({type: "SET_USER", payload: {user: updatedUser}})
                setCurrentPassword('');
                setPassword('');
                setConfirmPassword('');
            }
        } catch(err) {
            console.log(err);
            toast.error(globalFetchFailureMsg);
        } finally {
            setBtnSpinner(false);
        }
    }

    return (
        <ProtectedDashboardLayout>
            <div style={{border: "1px solid rgba(0, 0, 0, 0.2)", padding: "20px", borderRadius: "8px", width: '90%', margin: "100px auto"}} className="container">
                <h1>edit your profile</h1>
                <form className="d-flex flex-column gap-2" onSubmit={handleProfileData}>

                    <div className="d-flex column-gap-4">
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="name">name</label>
                            <input type="text" value={name} onChange={e=> setName(e.target.value)} name="name" id="name" autoComplete="name" />
                        </div>
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="email">email</label>
                            <input type="text" value={email} onChange={e=> setEmail(e.target.value)} name="email" id="email" autoComplete="email" />
                        </div>
                    </div>

                    <div className="d-flex column-gap-4 mt-2">
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="currentPassword">current password <small className="text-muted">(only to change your password)</small></label>
                            <input type="password" value={currentPassword} autoComplete="current-password" onChange={e=> setCurrentPassword(e.target.value)} name="currentPassword" id="currentPassword" />
                        </div>
                    </div>

                    <div className="d-flex column-gap-4 mt-2">
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="password">new password</label>
                            <input type="password" value={password} autoComplete="new-password" onChange={e=> setPassword(e.target.value)} name="password" id="password" />
                        </div>
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="confirmPassword">confirm Password</label>
                            <input type="password" value={confirmPassword} autoComplete="new-password" onChange={e=> setConfirmPassword(e.target.value)} name="confirmPassword" id="confirmPassword" />
                        </div>
                    </div>

                    <div className="d-flex column-gap-4 mt-2">
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="phone">enter your phone number</label>
                            <input type="text" value={phone} autoComplete="tel" onChange={e=> setPhone(e.target.value)} name="phone" id="phone" />
                        </div>
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="country">select your Country</label>
                                {existingCountriesSpinner && !existingCountries.length && <SyncOutlined spin />}
                                {existingCountries.length > 0 && !existingCountriesSpinner && (
                                    <select className="p-2" value={userCountry} onChange={e=> handleCountryChange(e.target.value)} name="country" id="country">
                                        <option value="">select your country</option>
                                        {existingCountries.map(country => <option key={country._id} value={country._id}>{country.name}</option>)}
                                    </select>
                                )}
                        </div>
                    </div>

                    <div className="d-flex column-gap-4 mt-2">
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="province">select your Province</label>
                                {existingProvincesSpinner && userCountry && !existingProvinces.length && <SyncOutlined spin />}
                                {!existingProvincesSpinner && (
                                    <select className="p-2" value={userProvince} onChange={e=> handleProvinceChange(e.target.value)} name="province" id="province" autoComplete="address-level1">
                                        {!userCountry && <option value="">select your country first</option>}
                                        {userCountry && <option value="">select your province</option>}
                                        {userCountry && existingProvinces.length > 0 &&
                                            existingProvinces.map(province => <option key={province._id} value={province._id}>{province.name}</option>)
                                        }
                                    </select>
                                )}
                        </div>
                        <div className="d-flex w-50 flex-column row-gap-1">
                            <label htmlFor="city">select your City</label>
                                {existingCitiesSpinner && userProvince && !existingCities.length && <SyncOutlined spin />}
                                {!existingCitiesSpinner && (
                                    <select className="p-2" value={userCity} onChange={e=> setUserCity(e.target.value)} name="city" id="city" autoComplete="address-level2">
                                        {!userCountry && <option value="">select your country first</option>}
                                        {userCountry && !userProvince && <option value="">select your province first</option>}
                                        {userCountry && userProvince && <option value="">select your city</option>}
                                        {userCountry && userProvince && existingCities.length > 0 &&
                                            existingCities.map(city => <option key={city._id} value={city._id}>{city.name}</option>)
                                        }
                                    </select>
                                )}
                        </div>
                    </div>

                    <div className="w-25 mx-auto mt-4">
                        <button disabled={btnSpinner} type="submit" className="btn btn-block btn-primary p-2 w-100">
                            {btnSpinner ? <SyncOutlined spin /> : "submit"}
                        </button>
                    </div>
                </form>
            </div>
        </ProtectedDashboardLayout>
    )
}

export default EditProfile
