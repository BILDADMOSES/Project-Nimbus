'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/common/Logo';

const Home = () => {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold"
        >
          <Logo width={40} height={40} fontSize="1.5rem" />
        </motion.h1>
        <nav className="flex items-center gap-4">
          <Link href="/signin">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-primary btn-sm rounded-full"
            >
              Sign in
            </motion.button>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pt-12 pb-3 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <div className="my-12">
            <Logo width={40} height={40} fontSize="3.5rem" />
          </div>
          <h2 className="text-5xl font-bold mb-4 text-base-content">
            Difference in language is never an issue
            <br />
            Communicate with Ease
          </h2>
          <p className="text-xl text-base-content/70 mb-8">
            Break language barriers with real-time translation
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary btn-lg rounded-full"
              >
                Let's get started
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 ml-2"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                >
                  <path d="M505.941 239.029L419.882 152.97c-15.119-15.119-40.971-4.411-40.971 16.971V216H35.059c-13.255 0-24 10.745-24 24v32c0 13.255 10.745 24 24 24H378.91v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941z" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Home;