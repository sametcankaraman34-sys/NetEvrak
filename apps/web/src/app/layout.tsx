import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetEvrak",
  description: "Dikey Belge Kontrol",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
      </head>
      <body className="netevrak-body">
        <header className="netevrak-header">
          <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
            <div className="container py-2">
              <a className="navbar-brand fw-semibold" href="/">
                NetEvrak
              </a>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#netevrakNavbar"
                aria-controls="netevrakNavbar"
                aria-expanded="false"
                aria-label="Menüyü aç/kapat"
              >
                <span className="navbar-toggler-icon" />
              </button>
              <div className="collapse navbar-collapse" id="netevrakNavbar">
                <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
                  <li className="nav-item">
                    <span className="badge rounded-pill text-bg-primary">
                      MVP
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </header>

        <div className="container py-4">{children}</div>

        <footer className="text-center text-muted py-4 small">
          © {year} NetEvrak
        </footer>

        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          defer
        />
      </body>
    </html>
  );
}

