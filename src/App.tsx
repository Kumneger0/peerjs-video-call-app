import React, { useState } from "react";
import Stream from "./components/Stream";
import Header from "./components/Header";

function App() {
  const [user, setUser] = useState<string | null>(null);

  return (
    <>
      <Header />
      <main className="w-11/12 mx-auto max-w-7xl grid place-items-center">
        <Stream />
      </main>
    </>
  );
}

export default App;
