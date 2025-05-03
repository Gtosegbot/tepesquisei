import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>Te Pesquisei - Plataforma Profissional de Pesquisas de Mercado</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </Helmet>
    <App />
  </HelmetProvider>
);
