import React from "react";
import { getToken } from "../auth/tokenService";

const Layout = ({ children }) => {
  const isAuth = !!getToken();

  return (
    <div className="layout">
      {isAuth}

      <div className={`main-content ${isAuth ? "with-sidebar" : "full-width"}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
