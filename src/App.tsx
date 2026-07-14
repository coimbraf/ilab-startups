/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import RootLayout from "./components/RootLayout";
import Home from "./pages/Home";
import StartupDetail from "./pages/StartupDetail";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import FounderPanel from "./pages/FounderPanel";
import ForumList from "./pages/ForumList";
import ForumPostDetail from "./pages/ForumPostDetail";
import Meetings from "./pages/Meetings";
import Register from "./pages/Register";
import Lessons from "./pages/Lessons";
import { AuthProvider } from "./contexts/AuthContext";
import { StartupsProvider } from "./contexts/StartupsContext";
import { UIProvider } from "./contexts/UIContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "startup/:id",
        element: <StartupDetail />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "cadastro",
        element: <Register />,
      },
      {
        path: "admin",
        element: <AdminPanel />,
      },
      {
        path: "painel",
        element: <FounderPanel />,
      },
      {
        path: "forum",
        element: <ForumList />,
      },
      {
        path: "forum/:id",
        element: <ForumPostDetail />,
      },
      {
        path: "encontros",
        element: <Meetings />,
      },
      {
        path: "academy",
        element: <Lessons />,
      }
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <StartupsProvider>
          <RouterProvider router={router} />
        </StartupsProvider>
      </UIProvider>
    </AuthProvider>
  );
}
