import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource-variable/manrope/wght.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/catalog.css";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import { CatalogProvider } from "./context/CatalogContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <CatalogProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </CatalogProvider>
  </BrowserRouter>,
);
