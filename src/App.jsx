import { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProfilePage from "./Pages/ProfilePage ";
import Chat from "./Pages/Chat";


const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProfilePage />} />
          <Route path="/chat" element={<Chat />} />
          {/* <Route path="/messenger" element={<MessengerPage />} />
          <Route path="/statistic" element={<StatisticPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/youth" element={<YouthPage />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
