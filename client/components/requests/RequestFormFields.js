import { CloseCircleOutlined, SyncOutlined } from "@ant-design/icons";
import Image from "next/image";
import { Button } from "antd";

export default function RequestFormFields({
  inputRef,
  requestTitle, setRequestTitle,
  requestDesc, setRequestDesc,
  requestImages, handleReuqestImages, removeImage,
  requestCategory, requestCategoryName, showCats, closeCats, catsSpinner, existingCats, handleCatsOpen, selectCat,
  requestLocationSource, setRequestLocationSource, isCustomLocation,
  requestCountry, handleCountryChange, existingCountries, existingCountriesSpinner,
  requestProvince, handleProvinceChange, existingProvinces, existingProvincesSpinner,
  requestCity, setRequestCity, existingCities, existingCitiesSpinner,
  btnSpinner, handleUserRequest,
}) {
  return (
    <div style={{border: "1px solid rgba(0, 0, 0, 0.2)", padding: "20px", borderRadius: "8px", width: '90%', margin: "100px auto"}} className="container">
      <h1 className="register text-center pt-4">enter your credentials</h1>
      <form style={{display: "flex", flexDirection: "column", rowGap: "20px"}} onSubmit={handleUserRequest}>

        <div className="d-flex column-gap-4 mt-2">
          <div className="w-50">
            <label className="d-flex flex-column" htmlFor="title">
              <span className="mb-2">what do you need?</span>
              <input value={requestTitle} onChange={e => setRequestTitle(e.target.value)} type="text" name="title" id="title" placeholder="i need a laptop/plumber..." />
            </label>
          </div>
          <div className="w-50 position-relative">
            <label className="d-flex flex-column" htmlFor="category">
              <span className="mb-2">which category your request is in?</span>
              <input value={requestCategoryName} ref={inputRef} onBlur={closeCats} onFocus={handleCatsOpen} name="category" id="category" readOnly />
              {showCats && (
                <div className="position-absolute start-0 top-100 end-0 rounded z-1">
                  {catsSpinner && <div className="py-2 bg-white px-3"><SyncOutlined spin /></div>}
                  {!catsSpinner && existingCats.length > 0 && existingCats.map(cat => <div className="p-2 bg-cat" role="button" onMouseDown={e => selectCat(e, cat)} key={cat._id}>{cat.name} - ({cat.type})</div>)}
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="d-flex column-gap-4 mt-2">
          <div className="w-25">
            <label className="mb-2" htmlFor="requestImages">select up to 5 images for your request</label>
            <input className="mw-100" multiple type="file" accept="image/jpeg,image/png,image/webp" id="requestImages" onChange={handleReuqestImages} />
          </div>
          <div className="d-flex column-gap-2 w-75">
            {requestImages.map(image => (
              <div key={image.id} className="position-relative">
                <Button onClick={e => removeImage(e, image.id)} className="position-absolute end-0 me-2 mt-2" icon={<CloseCircleOutlined />} />
                <Image className="rounded-4" alt={image.alt} src={image.preview} width={150} height={150} unoptimized />
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex column-gap-4 mt-2">
          <div className="w-50">
            <label className="mb-2" htmlFor="requestLocationSource">where do you need this product/service?</label>
            <select className="p-2 w-100" value={requestLocationSource} onChange={e => setRequestLocationSource(e.target.value)} name="requestLocationSource" id="requestLocationSource">
              <option value="default">my current location</option>
              <option value="custom">custom location</option>
            </select>
          </div>
          {isCustomLocation && (
            <div className="d-flex w-50 flex-column row-gap-1">
              <label htmlFor="requestCountry">select your Country</label>
              {existingCountriesSpinner && !existingCountries.length && <SyncOutlined spin />}
              {existingCountries.length > 0 && !existingCountriesSpinner && (
                <select className="p-2" value={requestCountry} onChange={e => handleCountryChange(e.target.value)} name="requestCountry" id="requestCountry">
                  <option value="">select your country</option>
                  {existingCountries.map(country => <option key={country._id} value={country._id}>{country.name}</option>)}
                </select>
              )}
            </div>
          )}
        </div>

        {isCustomLocation && (
          <div className="d-flex column-gap-4 mt-2">
            <div className="d-flex w-50 flex-column row-gap-1">
              <label htmlFor="requestProvince">select your Province</label>
              {existingProvincesSpinner && requestCountry && !existingProvinces.length && <SyncOutlined spin />}
              {!existingProvincesSpinner && (
                <select className="p-2" value={requestProvince} onChange={e => handleProvinceChange(e.target.value)} name="requestProvince" id="requestProvince" autoComplete="address-level1">
                  {!requestCountry && <option value="">select your country first</option>}
                  {requestCountry && <option value="">select your province</option>}
                  {requestCountry && existingProvinces.length > 0 &&
                    existingProvinces.map(province => <option key={province._id} value={province._id}>{province.name}</option>)
                  }
                </select>
              )}
            </div>
            <div className="w-50 d-flex flex-column row-gap-1 mt-2">
              <label htmlFor="requestCity">select your City</label>
              {existingCitiesSpinner && requestProvince && !existingCities.length && <SyncOutlined spin />}
              {!existingCitiesSpinner && (
                <select className="p-2" value={requestCity} onChange={e => setRequestCity(e.target.value)} name="requestCity" id="requestCity" autoComplete="address-level2">
                  {!requestCountry && <option value="">select your country first</option>}
                  {requestCountry && !requestProvince && <option value="">select your province first</option>}
                  {requestCountry && requestProvince && <option value="">select your city</option>}
                  {requestCountry && requestProvince && existingCities.length > 0 &&
                    existingCities.map(city => <option key={city._id} value={city._id}>{city.name}</option>)
                  }
                </select>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="d-flex flex-column" htmlFor="desc">
            <span className="mb-2">describe your request in details</span>
            <textarea className="p-2 rounded" value={requestDesc} onChange={e => setRequestDesc(e.target.value)} rows={10} name="desc" id="desc" placeholder="tell more about what you need as you can"></textarea>
          </label>
        </div>

        <button disabled={btnSpinner || !requestTitle || !requestDesc || !requestCategory || (isCustomLocation && (!requestCountry || !requestProvince || !requestCity))} type="submit" className="btn btn-block btn-primary p-2">
          {btnSpinner ? <SyncOutlined spin /> : "submit"}
        </button>
      </form>
    </div>
  )
}
