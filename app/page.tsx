"use client"

import { motion } from 'framer-motion';
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import mandela from "./assets/img/mandela.jpg"


const messages = [
  { text: 'Hello', direction: 'sent' },
  { text: 'Bonjour', direction: 'received' },
  { text: 'How are you?', direction: 'sent' },
  { text: 'Comment ça va?', direction: 'received' },
  { text: 'I am fine.', direction: 'sent' },
  { text: 'Je vais bien.', direction: 'received' },
  { text: 'Good to hear!', direction: 'sent' },
  { text: 'Content de l\'entendre!', direction: 'received' },
];

function ChatIllustration() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prevMessage) => (prevMessage + 1) % messages.length);
    }, 2000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="md:w-1/2 bg-gradient-to-br from-primary/20 to-black/50 h-[400px]  p-6 px-12 rounded-xl overflow-hidden flex flex-col justify-end space-y-2"
      initial={{ opacity: 0, x: 100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      {messages.slice(0, currentMessage + 1).map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className={`chat ${message.direction === 'sent' ? 'chat-end' : 'chat-start'}`}
        >
          <div
            className={`chat-bubble ${message.direction === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-900'}`}
          >
            {message.text}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
export default function Landing() {
    const languages = [
        { name: 'Swahili', speakers: '20M+' },
        { name: 'Arabic', speakers: '15M+' },
        { name: 'Hausa', speakers: '10M+' },
      ];
  return (
    <>
    <header className="backdrop-blur-md fixed z-50 top-0 w-full mx-auto px-4 py-6 flex justify-between items-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
              className="btn btn-primary btn-md rounded-md"
            >
              Sign in
            </motion.button>
          </Link>
          <ThemeSwitcher />
        </nav>
      </header>
    <div className="flex flex-col backdrop-blur-sm items-center justify-center min-h-screen py-2 bg-gradient-to-b from-black to-primary/50">
      <main className="flex md:pt-20 relative flex-col-reverse md:flex-row items-center justify-between w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Text Section */}
        <div className="text-center md:text-left md:w-1/2">
          <motion.h1
            className="text-4xl font-bold text-white md:text-6xl"
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome to ChatEasy
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-gray-200"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Break the language barrier with real-time translation of instant messages. Chat effortlessly across languages.
          </motion.p>
          <div className="flex mt-5 gap-2">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary btn-lg text-white rounded-md"
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
        </div>

        {/* Chat Section */}
        
            <ChatIllustration/>
        
      </main>
    </div>
    <section className='min-h-screen bg-black'>
    <div className="py-16 text-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-3xl font-bold text-center"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Most Spoken Languages in Africa
        </motion.h2>
        <motion.p
          className="mt-4 text-lg text-center text-gray-400"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Africa is home to a rich tapestry of languages. Here are the top three languages spoken across the continent, showcasing the diversity and cultural heritage.
        </motion.p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {languages.map((language, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-t from-black to-primary/90 p-8 py-12 rounded-lg shadow-lg text-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: index * 0.5 }}
            >
              <h3 className="text-3xl font-semibold text-gray-100">
                {language.name}
              </h3>
              <motion.p
                className="mt-4 text-4xl font-bold text-primary"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.3 }}
              >
                {language.speakers}
              </motion.p>
              <p className="my-2 text-gray-100">
                Speakers in Africa
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    <div className="h-72 relative w-full bg-image bg-cover bg- bg-center">
        <div className='absolute inset-0 bg-black/50 '></div>
    </div>
    </section>
    <section className="h-screen bg-black flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h2
          className="text-4xl font-bold text-primary mb-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Our Vision
        </motion.h2>
        <motion.p
          className="text-lg text-gray-400 mb-12"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          To create a world where language is no longer a barrier to communication, fostering global connections and understanding through seamless, real-time translation.
        </motion.p>
        <motion.h2
          className="text-4xl font-bold text-primary mb-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Our Mission
        </motion.h2>
        <motion.p
          className="text-lg text-gray-400"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Our mission is to empower individuals and communities across the globe by providing a chat platform that enables effortless communication in any language, breaking down barriers, and promoting cross-cultural collaboration and understanding.
        </motion.p>
      </motion.div>
    </section>
    <section className="h-screen bg-gray-900/90 text-white flex flex-col items-center justify-center px-6">
  <motion.div
    className="text-center max-w-3xl"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <Image
        src={mandela}
        alt={"Nelson Mandela"}
        width={300}
        height={300}
        className="rounded- mx-auto"
      />
    </motion.div>
    <motion.p
      className="text-lg italic"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      "If you talk to a man in a language he understands, that goes to his head.
      If you talk to him in his language, that goes to his heart."
    </motion.p>
    <motion.span
      className="block mt-4 text-sm"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      — Nelson Mandela
    </motion.span>
  </motion.div>
</section>
<footer>
      <div className="bg-gray-900/40 backdrop-blur-md py-4 text-white text-center">
        <p>&copy; {new Date().getFullYear()} ChatEasy. All rights reserved.</p>
      </div>
</footer>
    </>
  );
}
