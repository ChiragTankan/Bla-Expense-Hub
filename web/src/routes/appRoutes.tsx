import { useRoutes } from "react-router-dom";
import { ROUTES } from "../utils/routeConstants";
import { DefaultLayout } from "../layouts";
import PrivateRoute from "./privateRoute";
import PublicRoute from "./publicRoute";
import { Landing, Dashboard } from "../pages";

export default function AppRoutes() {
  return useRoutes([
    {
      element: <PublicRoute />,
      children: [{ path: ROUTES.HOME, element: <Landing /> }],
    },
    {
      element: <PrivateRoute />,
      children: [
        {
          element: <DefaultLayout />,
          children: [{ path: ROUTES.DASHBOARD, element: <Dashboard /> }],
        },
      ],
    },
  ]);
}
