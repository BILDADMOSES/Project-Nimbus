"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import phoneChat from "@/app/assets/img/phone-chat.png";
import logo_light from "@/app/assets/img/icon.svg";
import john from "@/app/assets/img/john.png";
import jane from "@/app/assets/img/jane.png";
import Link from "next/link";
import Logo from "@/components/common/Logo";

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold"
        >
          <Logo width={40} height={40} fontSize="1.5rem" logoSrc={logo_light} />
        </motion.h1>
        <nav className="flex items-center gap-4">
          <Link href="/sign-in">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
            >
              Sign in
            </motion.button>
          </Link>
          {/* <button className="text-2xl">⋯</button> */}
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-12 pb-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="my-12">
            <Logo
              width={40}
              height={40}
              fontSize="3.5rem"
              logoSrc={logo_light}
            />
          </div>
          <h2 className="text-5xl font-bold mb-4">
            Difference in language is never an issue
            <br />
            Communicate with Ease{" "}
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Break language barriers with real-time translation
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-full bg-white text-black font-medium flex items-center"
              >
                Let's get started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 ml-2"
                  viewBox="0 0 512 512"
                >
                  <path d="M505.941 239.029L419.882 152.97c-15.119-15.119-40.971-4.411-40.971 16.971V216H35.059c-13.255 0-24 10.745-24 24v32c0 13.255 10.745 24 24 24H378.91v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941z" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <div className="relative h-[600px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex justify-center items-center"
          >
            <Image
              src={phoneChat}
              alt="App Interface"
              width={400}
              height={700}
              className="rounded-3xl shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute left-0 top-1/4 bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <h3 className="text-sm font-semibold mb-2">Translation</h3>
            <div className="flex gap-2">
              <span className="text-2xl">🇺🇸</span>
              <span className="text-2xl">🇩🇪</span>
              <span className="text-2xl">🇪🇸</span>
              <span className="text-2xl">🇮🇹</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute right-0 top-1/3 bg-indigo-600 p-3 rounded-full shadow-md"
          >
            <Image
              src={john}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full inline-block"
            />
            <span className="ml-2">Jacob Simmons</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="absolute left-1/4 bottom-16 bg-blue-600 p-3 rounded-lg shadow-md"
          >
            <Image
              src={jane}
              alt="User Avatar"
              width={30}
              height={30}
              className="rounded-full inline-block mr-2"
            />
            <span>Let's discuss a new project?</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute right-1/4 top-16 bg-gray-800 p-3 rounded-lg shadow-md"
          >
            <div className="w-32 h-8 bg-blue-500 rounded-full"></div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Home;
