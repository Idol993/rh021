import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Archives from "@/pages/Archives";
import ArchiveDetail from "@/pages/ArchiveDetail";
import Diagnosis from "@/pages/Diagnosis";
import DiagnosisDetail from "@/pages/DiagnosisDetail";
import Pharmacy from "@/pages/Pharmacy";
import Inpatient from "@/pages/Inpatient";
import Membership from "@/pages/Membership";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="archives" element={<Archives />} />
          <Route path="archives/:id" element={<ArchiveDetail />} />
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="diagnosis/:id" element={<DiagnosisDetail />} />
          <Route path="pharmacy" element={<Pharmacy />} />
          <Route path="inpatient" element={<Inpatient />} />
          <Route path="membership" element={<Membership />} />
          <Route path="finance" element={<Finance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
