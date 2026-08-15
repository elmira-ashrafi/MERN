import ProtectedDashboardLayout from "@/components/wrappers/users/ProtectedDashboardLayout.js"
import { Context } from "@/context";
import { useContext } from "react";
import { apiFetch } from "@/lib/api";
import { useRequestForm } from "@/hooks/useRequestForm";
import RequestFormFields from "@/components/requests/RequestFormFields";

const SubmitRequest = () => {

    const {state: {user, authReady}} = useContext(Context);
    const profileLocation = user?.requesterProfile?.location || null;

    const form = useRequestForm({
        profileLocation,
        profileLocationReady: authReady,
        submitRequest: formData => apiFetch("/api/create-request", {method: "POST", body: formData}),
    });

    return (
        <ProtectedDashboardLayout>
            <RequestFormFields {...form} />
        </ProtectedDashboardLayout>
    )
}

export default SubmitRequest;
