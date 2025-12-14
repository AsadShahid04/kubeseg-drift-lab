export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="text-sm text-gray-600">
            Created by{" "}
            <a
              href="http://linkedin.com/in/asadshahid04"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium transition"
            >
              Asad Shahid
            </a>
          </div>
          <div className="text-xs text-gray-500 text-center md:text-right max-w-2xl">
            <p>
              This application is an independent educational project and is not
              affiliated with, endorsed by, or sponsored by Illumio, Inc. All
              references to Illumio, Illumio CloudSecure, and related products
              are for educational and demonstration purposes only. Illumio is a
              trademark of Illumio, Inc.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
