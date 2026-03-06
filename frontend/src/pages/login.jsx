import { LockKeyhole, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../api/api";
import Cookies from "js-cookie";
import { useHelper } from "../hooks/useHelper";

function LoginPage() {
  const loginRef = useRef();
  const navigate = useNavigate();
  const { isAuthenticated } = useHelper();

  const { mutate: login } = useMutation({
    mutationFn: (loginData) => loginAPI(loginData),

    onSuccess: (data) => {
      // console.log("Success", data);
      Cookies.set("access", data.access, { secure: false, sameSite: "Lax" });
      Cookies.set("refresh", data.refresh, {
        secure: false,
        sameSite: "Lax",
      });
      navigate("/");
    },

    onError: (error) => {
      console.error("Error", error);
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, []);

  if (isAuthenticated) {
    return null;
  }

  const loginSubmit = (e) => {
    e.preventDefault();

    const loginData = new FormData(loginRef.current);
    login(loginData);
  };

  return (
    <main className="flex w-screen h-screen justify-center items-center bg-slate-100">
      <div className="bg-white flex shadow-lg w-[450px] h-[500px]">
        <form
          ref={loginRef}
          onSubmit={loginSubmit}
          className="flex flex-col p-7 gap-6 justify-center items-center w-full"
        >
          <section className="flex justify-center items-center">
            <h1 className="text-violet-950 text-2xl">User Login</h1>
          </section>

          <section className="flex flex-col gap-4 w-full">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 text-violet-950">
                <Mail size={18} />
              </span>

              <input
                type="email"
                name="email"
                placeholder="Enter your emial"
                className="border border-gray-300 p-2 rounded-lg w-full pl-10 focus:outline-none bg-indigo-950/10 focus:outline-none focus:ring-2 focus:ring-indigo-950"
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 text-violet-950">
                  <LockKeyhole size={18} />
                </span>

                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className="border border-gray-300 p-2 rounded-lg w-full pl-10 focus:outline-none bg-indigo-950/10 focus:outline-none focus:ring-2 focus:ring-indigo-950"
                />
              </div>
              <div className="flex flex-row-reverse">
                <p className="text-blue-400">Forgot password?</p>
              </div>
            </div>
          </section>

          <section className="flex justify-center items-center">
            <button
              className="bg-linear-to-bl from-indigo-700 to-violet-950 text-white px-4 py-2 rounded"
              type="submit"
            >
              Login
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}

export default LoginPage;