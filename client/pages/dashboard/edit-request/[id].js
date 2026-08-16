import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout.js"
import { useContext } from "react";
import Link from "next/link";
import { Context } from "@/context/auth";
import { apiFetch, getServerProps } from "@/lib/api";
import { useRequestForm } from "@/hooks/useRequestForm";
import RequestFormFields from "@/components/requests/RequestFormFields";

// the request's own location comes back populated ({_id, name}), the profile's doesn't — both end up as plain ids here
const toId = value => (value && typeof value === "object" ? value._id : value) || '';

const EditRequest = ({data, error}) => {

  const {state: {user: contextUser, authReady}} = useContext(Context)
  const profileLocation = contextUser?.requesterProfile?.location || null;

  const form = useRequestForm({
    profileLocationReady: authReady,
    initialTitle: data?.title,
    initialDescription: data?.description,
    initialImages: (data?.requestImages || []).map(img => ({
      id: img._id || img.url,
      file: null,
      alt: img.alt || data.title,
      preview: img.url
    })),
    initialCategoryId: data?.category?._id,
    initialCategoryName: data?.category ? `${data.category.type} - ${data.category.name}` : '',
    initialLocationSource: data?.locationSource,
    initialCountry: toId(data?.location?.country),
    initialProvince: toId(data?.location?.province),
    initialCity: toId(data?.location?.city),
    profileLocation,
    submitRequest: formData => apiFetch(`/api/edit-request/${data._id}`, {method: "PATCH", body: formData}),
  });

  // getServerSideProps can legitimately return no request, so nothing below may assume one
  if(error || !data) {
    return (
      <ProtectedDashboardLayout>
        <div className="pt-5 text-center">
          <h2>{error || "request not found"}</h2>
          <Link href="/dashboard/my-requests">back to my requests</Link>
        </div>
      </ProtectedDashboardLayout>
    )
  }

  return (
    <ProtectedDashboardLayout>
      <RequestFormFields {...form} />
    </ProtectedDashboardLayout>
  )
}

export default EditRequest;

export const getServerSideProps = getServerProps('get-request')
