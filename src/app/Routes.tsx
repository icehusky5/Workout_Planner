import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "../pages/Dashboard";
import LibraryPage from "../pages/Library";
import PlanPage from "../pages/Plan";
import SessionPage from "../pages/Session";
import TemplatesPage from "../pages/Templates";

/**
* Not Found page for invalid routes.
*/
function NotFound() {
  return (
    <div className="container py-4">
      <h1 className="h4">404 - Page not found</h1>
      <p className="text-body-secondary">The page you are looking for does not exist.</p>
    </div>
  );
}

/**
 * Application router.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,

    /**
     * Child routes.
     */
    children: [
      /**
       * Index route for the default page Dashboard.
       */
      { index: true, element: <Dashboard /> },

      /**
       * Weekly plan page.
       */
      { path: "plan", element: <PlanPage /> },

      /**
       * Template page.
       */
      { path: "templates", element: <TemplatesPage /> },

      /**
       * Exercise library.
       */
      { path: "library", element: <LibraryPage /> },

      /**
       * Session page for a specific date.
       */
      { path: "session/:date", element: <SessionPage /> },

      /**
       * Not Found page for all the invalid paths.
       */
      { path: "*", element: <NotFound /> },
    ],
  },
]);