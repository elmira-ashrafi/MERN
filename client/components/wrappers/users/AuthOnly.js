import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { Context } from "@/context";
import { Spin } from "antd";


const AuthOnly = ({children, redirectTo = "/login"}) => {

    //prepare global context
    const {state: { user, authReady } } = useContext(Context);

    //prepare router for redirect user
    const router = useRouter();

    //redirect user if currently is not logged in
    useEffect(() => {
        if( authReady && !user) {
            router.replace(redirectTo);
        }
    }, [user, authReady, router, redirectTo])

    //show spin untill auth is ready
    if(!authReady) {
        return <Spin fullscreen />
    }

    //show spin if auth is ready and user is a guest, untill redirect performs
    if(!user) {
        return <Spin fullscreen />
    }

    return <>{children}</>
}

export default AuthOnly
