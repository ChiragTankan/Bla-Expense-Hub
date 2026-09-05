import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../utils/routeConstants";

const PrivateRoute = () =>
  !!localStorage.getItem("token") ? (
    <Outlet />
  ) : (
    <Navigate to={ROUTES.HOME} />
  );
  export default PrivateRoute;
