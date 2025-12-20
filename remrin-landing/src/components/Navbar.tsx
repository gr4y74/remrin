"use client";
import Link from "next/link";
import Image from "next/image";

export const Navbar = () => {
  const navigation = [
    { name: "Home", href: "/" },
    { name: "Soul Forge", href: "/forge/forge.html" },
    { name: "Chat", href: "/chat" },
    { name: "Market", href: "/market" },
    { name: "Community", href: "/community" },
  ];

  return (
    <header className="fixed top-4 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full">
      <nav className="nav-floating relative max-w-4xl w-full flex flex-wrap md:flex-nowrap basis-full items-center justify-between py-2 ps-5 pe-2 md:py-0 mx-auto rounded-full border border-white/10">

        {/* Logo */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex-none rounded-md inline-block focus:outline-none focus:opacity-80 logo-tilt"
            aria-label="Remrin"
          >
            <Image
              src="/logo.svg"
              alt="Remrin.ai"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Button Group */}
        <div className="md:order-3 flex items-center gap-x-3">
          <div className="md:ps-3">
            <Link
              href="/forge/forge.html"
              className="group inline-flex items-center gap-x-2 py-2 px-4 bg-primary-500 font-medium text-sm text-white rounded-full hover:bg-primary-400 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/30 focus:outline-none"
            >
              Start Forging
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              type="button"
              className="size-9 flex justify-center items-center text-sm font-semibold rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
              aria-label="Toggle Menu"
            >
              <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden md:block">
          <div className="flex flex-row items-center gap-y-3 py-2 md:py-0 md:ps-7">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-3 py-4 text-sm text-white/80 hover:text-primary-400 transition-colors focus:outline-none"
              >
                {item.name}
              </Link>
            ))}

            {/* About Dropdown */}
            <div className="relative group">
              <button className="px-3 py-4 flex items-center text-sm text-white/80 hover:text-primary-400 transition-colors focus:outline-none">
                About
                <svg className="ms-1 shrink-0 size-3.5 transition-transform group-hover:rotate-180" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {/* Dropdown Menu */}
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute top-full left-0 mt-2 w-48 rounded-xl bg-neutral-800/90 backdrop-blur-md p-2 transition-all duration-200 border border-white/10">
                <Link href="/about" className="block px-4 py-2 text-sm text-white hover:text-primary-400 hover:bg-white/5 rounded-lg transition-colors">
                  Our Story
                </Link>
                <Link href="/team" className="block px-4 py-2 text-sm text-white hover:text-primary-400 hover:bg-white/5 rounded-lg transition-colors">
                  Team
                </Link>
                <Link href="/contact" className="block px-4 py-2 text-sm text-white hover:text-primary-400 hover:bg-white/5 rounded-lg transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
