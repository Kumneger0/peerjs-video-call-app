import React, {
  Dispatch,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import Stream from "./components/Stream";
import Header from "./components/Header";
import { SetStateAction } from "jotai";
import { Route, Routes, useNavigate } from "react-router-dom";

export const UserContext = createContext<{
  user: string | null;
  setUser?: Dispatch<SetStateAction<string | null>>;
}>({ user: null });

function App() {
  const [user, setUser] = useState<string | null>(null);

  return (
    <>
      <UserContext.Provider value={{ user, setUser }}>
        <Header />
        <main className="w-11/12 mx-auto max-w-7xl grid place-items-center">
          <Routes>
            <Route
              path="/"
              element={
                <div className="font-bold text-white capitalize">homepage</div>
              }
            />
            <Route path="/call" Component={Stream} />

            <Route path="/join" Component={Join} />
          </Routes>
        </main>
      </UserContext.Provider>
    </>
  );
}

export default App;

function Join() {
  const nameRef = useRef<HTMLInputElement>(null);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  return (
    <>
      <div>
        <input ref={nameRef} type="text" name="" id="" />
      </div>
      <div>
        <button
          onClick={() => {
            if (setUser) {
              if (nameRef.current) {
                setUser(nameRef.current.value);
                navigate("/call");
              }
            }
          }}>
          join
        </button>
      </div>
    </>
  );
}
