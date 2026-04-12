import { RouterProvider } from "react-router-dom";
import { router } from "./Routes.tsx";

/**
 * Root application component.
 */
export default function App() {
  return <RouterProvider router={router} />;
}