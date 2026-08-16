import { Context } from "@/context/auth";
import { useRouter } from "next/router";
import { useContext } from "react";
import AuthOnly from "./AuthOnly";
import DashboardRoutes from "./DashboardRoutes";

export default function ProtectedDashboardLayout({children}) {
    
    const {state: { user } } = useContext(Context)

    const { pathname } = useRouter()

    return (
        <AuthOnly>
            <DashboardRoutes user={user} pathname={pathname}>
                {children}
            </DashboardRoutes>
        </AuthOnly>
    )
}