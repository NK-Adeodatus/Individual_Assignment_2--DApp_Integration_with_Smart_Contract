import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Verify from "./pages/Verify.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { useWallet } from "./hooks/useWallet.js";

export default function App() {
  const wallet = useWallet();

  return (
    <BrowserRouter>
      <Navbar wallet={wallet} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home wallet={wallet} />} />
          <Route path="/register" element={<Register wallet={wallet} />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/dashboard" element={<Dashboard wallet={wallet} />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

