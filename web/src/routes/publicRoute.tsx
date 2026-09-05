import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../utils/routeConstants";

const PublicRoute = () =>
  !localStorage.getItem("token") ? (
    <Outlet />
  ) : (
    <Navigate to={ROUTES.DASHBOARD} />
  );
export default PublicRoute;
