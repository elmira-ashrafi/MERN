import { useState } from "react";
import { SyncOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { apiFetch } from "@/lib/api";
import GuestOnly from "@/components/wrappers/users/GuestOnly.js";
import { useRouter } from "next/router";

const ForgotPassword = () => {
  //prepare form states
  const [email, setEmail] = useState("");
  const [emailHolder, setEmailHolder] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [spinner, setSpinner] = useState(false);

  const router = useRouter();

  //handle sending email request
  const sendEmail = async (e) => {
    //throttle furthure requests
    e.preventDefault();
    setSpinner(true);

    //config request for send email
    let fetchConfig = {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    };

    try {
      //send email
      let res = await apiFetch(`/api/send-email`, fetchConfig);
      let data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data.message ||
            "failed to reset your password! please check your conectivity",
        );
      }

      //show successfull message
      toast.success(data.message, { position: "top-left" });

      //check email flag as sent
      setEmailSent(true);
      setEmailHolder(email);
      setEmail("");
    } catch (err) {
      //empty fields and show error
      toast.error(err.message, { position: "top-left" });
      setEmail("");
    } finally {
      setSpinner(false);
    }
  };

  //handle sent code request
  const sendCode = async (e) => {
    //throttle furthure requests
    e.preventDefault();
    setSpinner(true);

    //config request for sending code
    let fetchConfig = {
      method: "POST",
      body: JSON.stringify({
        code,
        email: emailHolder,
      }),
    };

    try {
      //send code
      const res = await apiFetch("/api/confirm-code", fetchConfig);
      const { ok, message } = await res.json();

      //handle response, `message` is the server's own error text
      if (!res.ok || !ok) {
        toast.error(message || "something went wrong! please try again");
        setCode("");
      } else {
        setCodeSent(true);
        toast.success("confirmation succeed! now enter your new password");
      }
    } catch {
      toast.error("something went wrong! please try again");
      setCode("");
    } finally {
      setSpinner(false);
    }
  };

  //handle send new password request
  const sendNewPassword = async (e) => {
    //throttle furthure requests
    e.preventDefault();
    setSpinner(true);

    //config reset password fetch request, the code is re-checked by the server on this step too
    let fetchConfig = {
      method: "POST",
      body: JSON.stringify({
        code,
        password,
        confirmPassword,
        email: emailHolder,
      }),
    };

    try {
      //send new password
      const res = await apiFetch("/api/new-password", fetchConfig);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "failed to set your new password");
      }

      //show message
      toast.success(data.message);

      router.replace("/login");
    } catch (err) {
      //handle error
      toast.error(err.message);
    } finally {
      //empty password fields always
      setPassword("");
      setConfirmPassword("");
      setSpinner(false);
    }
  };

  return (
    <GuestOnly>
      <div
        style={{
          border: "1px solid rgba(0, 0, 0, 0.2)",
          padding: "20px",
          borderRadius: "8px",
          width: "30%",
          margin: "100px auto",
        }}
        className="container"
      >
        <h1 className="register text-center pt-4">reset your password</h1>
        <form
          style={{ display: "flex", flexDirection: "column", rowGap: "20px" }}
          onSubmit={
            !emailSent
              ? sendEmail
              : emailSent && !codeSent
                ? sendCode
                : sendNewPassword
          }
        >
          {!emailSent && (
            <label className="d-flex flex-column" htmlFor="email">
              <span className="mb-2">please enter your email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                name="email"
                id="email"
                placeholder="enter your email"
              />
            </label>
          )}

          {emailSent && !codeSent && (
            <label className="d-flex flex-column" htmlFor="code">
              <span className="mb-2">please enter sent code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                type="text"
                name="code"
                id="code"
                placeholder="enter sent code"
              />
            </label>
          )}

          {emailSent && codeSent && (
            <>
              <label className="d-flex flex-column" htmlFor="password">
                <span className="mb-2">please enter your new password</span>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  name="password"
                  id="password"
                  placeholder="enter new password"
                  autoComplete="new-password"
                />
              </label>
              <label className="d-flex flex-column" htmlFor="confirmPassword">
                <span className="mb-2">please confirm your new password</span>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="reenter new password"
                  autoComplete="new-password"
                />
              </label>
            </>
          )}

          <button
            disabled={
              spinner ||
              (!emailSent && !email) ||
              (emailSent && !codeSent && !code) ||
              (emailSent && codeSent && (!password || !confirmPassword))
            }
            type="submit"
            className="btn btn-block btn-primary p-2"
          >
            {spinner ? <SyncOutlined spin /> : "submit"}
          </button>
        </form>
      </div>
    </GuestOnly>
  );
};

export default ForgotPassword;
