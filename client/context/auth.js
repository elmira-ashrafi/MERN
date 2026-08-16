import { useReducer, createContext, useEffect } from "react";
import { apiFetch, fetchCsrfToken, setUnauthorizedHandler } from "../lib/api";
import { toast } from "react-toastify";

const initialState = {
    user: null,
    authReady: false
}

const Context = createContext()

const rootReducer = (state, action) => {
  switch(action.type) {
    case "SET_USER" :
      return {...state, user: action.payload.user, authReady: true }
    case "LOGOUT" :
      return {...state, user: null, authReady: true}
    case "SET_PICTURE" : 
      return {...state, user: {...state.user, avatar: action.payload.avatar}}
    default: return state;
  }
}

const Provider = ({children}) => {
    const [state, dispatch] = useReducer(rootReducer, initialState);

    // let the fetch layer drop the session when the server stops accepting the cookie
    useEffect(() => {
        setUnauthorizedHandler(() => dispatch({type: "LOGOUT"}));
        return () => setUnauthorizedHandler(null);
    }, []);

    useEffect(() => {
        (async () => {
            // the csrf token has to be in place before any mutating request can succeed
            try {
                await fetchCsrfToken();
            } catch {
                toast.error('failed to start a secure session');
            }

            try {
                const res = await apiFetch('/api/current-user');
                const {ok, user} = await res.json();

                if(!res.ok || !ok || !user) {
                    dispatch({type: "LOGOUT"});
                } else {
                    dispatch({type: "SET_USER", payload: {user}});
                    dispatch({type: "SET_PICTURE", payload: {avatar: user.avatar}})
                }

            } catch {
                dispatch({type: "LOGOUT"});
            }
        })();
    }, []);

    return <Context.Provider value={{state, dispatch}} >{children}</Context.Provider>
}

export {Context, Provider}
