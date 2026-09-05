import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <div>
      <header>Navbar</header>
      <Outlet />
    </div>
  );
}