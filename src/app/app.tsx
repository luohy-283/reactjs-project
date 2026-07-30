import { BrowserRouter } from "react-router";
import { AppProvider } from "@/app/provider";
import { AppRouter } from "@/app/router";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProvider>
  );
}
