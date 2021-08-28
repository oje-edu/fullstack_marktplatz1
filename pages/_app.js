import "../styles/globals.css";
import Link from "next/link";

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <nav className="p-6 border-b">
        <p className="text-4xl font-bold">Am Marktplatz 1</p>
        <div className="flex mt-4">
          <Link href="/">
            <a className="mr-6 text-blue-500 hover:text-blue-700">Start</a>
          </Link>
          <Link href="/create-item">
            <a className="mr-6 text-blue-500 hover:text-blue-700">
              Digitales Gut verkaufen
            </a>
          </Link>
          <Link href="/my-assets">
            <a className="mr-6 text-blue-500 hover:text-blue-700">
              Meine digitalen Güter
            </a>
          </Link>
          <Link href="/creator-dashboard">
            <a className="mr-6 text-blue-500 hover:text-blue-700">
              Mein Dashboard
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
