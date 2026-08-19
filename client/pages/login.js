import { useState, useContext } from "react"
import { Context } from "@/context/auth.js"
import { SyncOutlined } from "@ant-design/icons"
import { toast } from "react-toastify"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import GuestOnly from '@/components/wrappers/users/GuestOnly.js'
import { getErrorMessage } from "@/lib/strings"

const Login = () => {

    //prepare global context
    const { dispatch } = useContext(Context);

    //prepare login form states
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [remember, setRemember] = useState(false);
    const [spinner, setSpinner] = useState(false);

    //handle user login
    const handleLoginFormSubmit = async e => {
        e.preventDefault()

        //config login fetch request
        let fetchConfig = {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                remember
            })
        }

        try {
            //send login request and throttle furthure requests
            setSpinner(true);

            let res = await apiFetch(`/api/login`, fetchConfig);
            let data = await res.json();

            //surface the message the server actually sent
            if(!res.ok || !data.ok) {
                throw new Error(data.message || 'an error occured');
            }

            //show successfull message
            toast.success('wow! you have logged in successfully. you will be redirect in a moment', { position: "top-left" } );

            //empty fields
            setEmail("");
            setPassword("");
            setRemember(false);

            //dispatch user data to global context, GuestOnly performs the redirect
            dispatch({type: "SET_USER", payload: {user: data.user}});

        } catch(err) {
            toast.error(getErrorMessage(err), {position: "top-left"});
        } finally {
            setSpinner(false);
        }
    }

  return (
    <GuestOnly>
      <div className="container px-2">
        <div className="register-container border rounded-3 p-4 my-5 mx-auto col-12 col-md-5">
          <h1 className="register text-center pt-4">enter your credentials</h1>
          <form style={{display: "flex", flexDirection: "column", rowGap: "20px"}} onSubmit={handleLoginFormSubmit}>

              <label className="d-flex flex-column" htmlFor="email">
                <span className="mb-2" >please enter your email</span>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" name="email" id="email" placeholder="enter your email" autoComplete="email" />
              </label>

              <label className="d-flex flex-column" htmlFor="password">
                <span className="mb-2" >please enter your password</span>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" name="password" id="password" placeholder="enter your password" autoComplete="current-password" />
              </label>

              <label className="d-flex align-items-center" htmlFor="remember">
                <span className="me-1">Remember?</span>
                <input checked={remember} onChange={e => setRemember(!remember)} type="checkbox" name="remember" id="remember" />
              </label>

              <button disabled={!email || !password || spinner} type="submit" className="btn btn-block btn-primary p-2">
                  {spinner ? <SyncOutlined spin /> : "submit"}
              </button>
              <p className="text-center mb-0">don&apos;t have an account? <strong><Link href="/register">register</Link></strong></p>
              <p className="text-center">forgot your password? <strong><Link href="/forgot-password">reset password</Link></strong></p>
          </form>
        </div>
      </div>
    </GuestOnly>
  )
}

export default Login
