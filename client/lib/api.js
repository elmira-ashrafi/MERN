import { toast } from "react-toastify";
import { API_BASE } from "./config";

let csrfToken = null;

let refreshPromise = null;

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

function setCsrfToken(token) {
    csrfToken = token;
}

function needCsrf(method) {
    return ['PATCH', 'PUT', 'DELETE', 'POST'].includes((method || "GET").toUpperCase());
}

export async function fetchCsrfToken () {
    const res = await fetch('/api/csrf-token', {credentials: 'include'});

    if(!res.ok) {
        throw new Error('failed to fetch CSRF Token');
    }

    const data = await res.json();

    if(!data?.csrfToken) {
        throw new Error("missing CSRF Token from server");
    }

    setCsrfToken(data.csrfToken);
    return data.csrfToken;
}

function refreshCsrfToken() {
    if(!refreshPromise) {
        refreshPromise = fetchCsrfToken().finally(() => {
            refreshPromise = null
        })
    }
    return refreshPromise;
}

function doFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});

    // FormData has to keep its own multipart boundary, so it is never given a Content-Type here
    if(options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set("Content-Type", 'application/json');
    }

    if(needCsrf(options.method) && csrfToken) {
        headers.set("X-CSRF-Token", csrfToken);
    }

    return fetch(path, {
        ...options,
        headers,
        credentials: 'include'
    });
}

function onUnAuthorized () {
    unauthorizedHandler?.();
}

export async function apiFetch(path, options={}) {
    let res = await doFetch(path, options);

    // a rejected csrf token is recoverable: fetch a fresh one and replay once
    if(res.status === 403 && needCsrf(options.method)) {
        await refreshCsrfToken();
        res = await doFetch(path, options);
    }

    // checked after the replay too, the retried request can still come back unauthorised
    if(res.status === 401) {
        onUnAuthorized();
    }

    if(res.status === 500) {
      throw new Error("something went wrong! please try again later");
    }

    if(res.status === 413) {
      throw new Error("your file is too large! maximum file size is 5 MB");
    }

    return res;
}

export const handleFetch = async (setSpinner, path, fetchConfig, globalFetchFailureMsg, setData) => {
  try {
    setSpinner(true)

    const res = await apiFetch(path, fetchConfig);
    const {ok, message} = await res.json();

    if(!res.ok || !ok || !Array.isArray(message)) {
      if(typeof message === "string") toast.error(message);
      setData([]);
    } else {
      setData(message);
    }

  } catch {
    toast.error(globalFetchFailureMsg);
    setData([]);
  } finally {
    setSpinner(false)
  }
}

export function getServerProps(path) {
    return async function(ctx) {

        const failed = error => ({props: {data: null, user: null, error}});

        try {
            const { id } = ctx.params;
            const cookie = ctx.req.headers.cookie || "";

            const [dataRes, authRes] = await Promise.all([
                fetch(`${API_BASE}/${path}/${id}`, {headers: {cookie}}),
                fetch(`${API_BASE}/current-user`, {headers: {cookie}})
            ]);

            const [data, authData] = await Promise.all([
                dataRes.json().catch(() => ({})),
                authRes.json().catch(() => ({}))
            ])

            if(!authRes.ok || !authData.ok) {
                if (authRes.status === 401) {
                    return {
                        redirect: {
                            destination: "/login",
                            permanent: false
                        }
                    }
                }

                if(authRes.status === 403) return failed("invalid csrf token");

                return failed("failed to load your session");
            }

            if(!dataRes.ok || !data.ok || !data.message) {
                if(dataRes.status === 404 || dataRes.status === 400) {
                    return { notFound: true }
                }

                return failed("failed to fetch data");
            }

            return {
                props: {data: data.message, user: authData.user, error: null}
            };

        } catch (err){
            console.log(err)
            return failed("something failed! please try again later");
        }
    }
}