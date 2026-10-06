import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import ApplyJob from "./pages/ApplyJob";
import ApplicationSuccess from "./pages/ApplicationSuccess";
export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/jobs"
            element={<Jobs />}
          />

          <Route
            path="/jobs/:slug"
            element={<JobDetails />}
          />

          <Route
            path="/jobs/:slug/apply"
            element={<ApplyJob />}
          />

          <Route
            path="/application-success"
            element={<ApplicationSuccess />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}