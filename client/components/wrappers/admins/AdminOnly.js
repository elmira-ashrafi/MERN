import { Context } from "@/context/auth";
import { Spin } from "antd";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";

export default function AdminOnly({children, redirectTo = "/"}) {

    const {state: { user, authReady } } = useContext(Context)

    const router = useRouter()

    // the role enum on the server stores "Admin", the casing has to match exactly
    const isAdmin = user?.role?.includes("Admin");

    useEffect(() => {
        if(authReady && !isAdmin) {
            router.replace(redirectTo);
        }
    }, [isAdmin, authReady, router, redirectTo])

    //show spin untill auth is ready
    if(!authReady) return <Spin fullscreen />

    //show spin while the redirect above is being performed
    if(!isAdmin) return <Spin fullscreen />

    return <>{children}</>
}
