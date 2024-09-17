"use client"
import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import Image from "next/image";
import mandela from "./assets/img/mandela.jpg";
import aloys from "./assets/img/aloys.png";
import michael from "./assets/img/michael.png";
import bildad from "./assets/img/bildad.png";
import PricingSection from '@/components/PricingPlan';


const messages = [
  { text: "Hello", direction: "sent" },
  { text: "Bonjour", direction: "received" },
  { text: "How are you?", direction: "sent" },
  { text: "Comment ça va?", direction: "received" },
  { text: "I am fine.", direction: "sent" },
  { text: "Je vais bien.", direction: "received" },
  { text: "Good to hear!", direction: "sent" },
  { text: "Content de l'entendre!", direction: "received" },
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
      className="w-full mt-24 my-10 md:w-1/2 bg-gradient-to-br from-primary/20 to-black/50 dark:from-primary/10 dark:to-white/10 h-[400px] p-6 md:px-12 rounded-xl overflow-hidden flex flex-col justify-end space-y-2"
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
          className={`chat ${
            message.direction === "sent" ? "chat-end" : "chat-start"
          }`}
        >
          <div
            className={`chat-bubble ${
              message.direction === "sent"
                ? "bg-blue-500 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            }`}
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
    { name: "Swahili", speakers: "20M+" },
    { name: "Arabic", speakers: "15M+" },
    { name: "Hausa", speakers: "10M+" },
  ];

  return (
    <>
      <header className="backdrop-blur-md fixed z-50 top-0 w-full mx-auto px-4 py-6 flex justify-between items-center bg-white/10 dark:bg-black/10">
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
      <div className="flex flex-col backdrop-blur-sm items-center justify-center min-h-screen py-2 bg-gradient-to-b from-white to-primary/50 dark:from-black dark:to-primary/50">
        <main className="flex md:pt-20 relative flex-col-reverse md:flex-row items-center justify-between w-full max-w-6xl px-4 sm:px-6 lg:px-8 overflow-x-hidden">
          {/* Text Section */}
          <div className="text-center md:text-left md:w-1/2">
            <motion.h1
              className="text-4xl font-bold text-black dark:text-white md:text-6xl"
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Welcome to ChatEasy
            </motion.h1>
            <motion.p
              className="mt-4 text-lg text-gray-800 dark:text-gray-200"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Break the language barrier with real-time translation of instant
              messages. Chat effortlessly across languages.
            </motion.p>
            <div className="flex justify-center md:justify-start mt-5 gap-2">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary btn-md text-black dark:text-white rounded-md"
                >
                  Get started
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Chat Section */}
          <ChatIllustration />
        </main>
      </div>
      <section className="min-h-screen bg-gray-100 dark:bg-black">
        <div className="py-16 text-primary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl font-bold text-center text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Most Spoken Languages in Africa
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-center text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Africa is home to a rich tapestry of languages. Here are the top
              three languages spoken across the continent, showcasing the
              diversity and cultural heritage.
            </motion.p>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {languages.map((language, index) => (
                <motion.div
                  key={index}
                  className="bg-gradient-to-t from-gray-200 to-primary/90 dark:from-black dark:to-primary/90 p-8 py-12 rounded-lg shadow-lg text-center"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: index * 0.5 }}
                >
                  <h3 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
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
                  <p className="my-2 text-gray-900 dark:text-gray-100">Speakers in Africa</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-72 relative w-full bg-image bg-cover bg-center">
          <div className="absolute inset-0 bg-black/50 dark:bg-white/10"></div>
        </div>
      </section>
      <section className="py-10 bg-gray-100 dark:bg-black flex flex-col items-center justify-center px-6">
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
            className="text-lg text-gray-600 dark:text-gray-400 mb-12"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            To create a world where language is no longer a barrier to
            communication, fostering global connections and understanding
            through seamless, real-time translation.
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
            className="text-lg text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Our mission is to empower individuals and communities across the
            globe by providing a chat platform that enables effortless
            communication in any language, breaking down barriers, and promoting
            cross-cultural collaboration and understanding.
          </motion.p>
        </motion.div>
      </section>
      <section className="bg-gray-200 dark:bg-black/50 text-gray-900 dark:text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl text-primary font-bold text-center mb-8"
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Meet The Team
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src={michael}
                alt="Michael Wekesa"
                width={150}
                height={150}
                className="mx-auto grayscale rounded-full mb-4"
              />
              <h3 className="text-xl font-semibold text-primary">
                Michael Wekesa
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Software Lead</p>
            </motion.div>
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src={bildad}
                alt="Bildad Okoth"
                width={150}
                height={150}
                className="mx-auto grayscale rounded-full mb-4"
              />
              <h3 className="text-xl text-primary font-semibold">
                Bildad Okoth
              </h3>
              <p className="text-gray-600 dark:text-gray-400">AI Lead</p>
            </motion.div>
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src={aloys}
                alt="Aloys Aboge"
                width={150}
                height={150}
                className="mx-auto grayscale rounded-full mb-4"
              />
              <h3 className="text-xl text-primary font-semibold">
                Aloys Aboge
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Design Lead</p>
            </motion.div>
          </div>
        </div>
      </section>
      <section className=" py-10 bg-gray-100 dark:bg-black text-gray-900 dark:text-white flex flex-col items-center justify-center px-6">
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
            About Us
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400 mb-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            We are a passionate team from Kabark University in Kenya, dedicated
            to solving complex problems through innovative AI solutions. Our
            journey began with a shared vision of leveraging artificial
            intelligence to tackle real-world challenges and enhance the way
            people communicate.
          </motion.p>
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400 mb-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            At ChatEasy, we are committed to breaking down language barriers and
            fostering global connections. Our team combines expertise in AI,
            software development, and design to create a seamless chat platform
            that transcends linguistic divides. We believe in the power of
            technology to bridge gaps and bring people closer together.
          </motion.p>
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Our love for problem-solving and dedication to advancing AI drives
            us to continually innovate and improve our platform. Join us in our
            mission to create a world where communication is effortless, no
            matter the language.
          </motion.p>
        </motion.div>
      </section>

      <section className="py-10 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-6">
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
              alt="Nelson Mandela"
              width={300}
              height={300}
              className="rounded-full mx-auto h-[200px] w-[200px] md:w-[300px] md:h-[300px]"
            />
          </motion.div>
          <motion.p
            className="text-lg italic text-gray-700 dark:text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            "If you talk to a man in a language he understands, that goes to his
            head. If you talk to him in his language, that goes to his heart."
          </motion.p>
          <motion.span
            className="block mt-4 text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            — Nelson Mandela
          </motion.span>
        </motion.div>
      </section>
      <footer>
        <div className="bg-gray-100 dark:bg-gray-900 backdrop-blur-md py-4 text-gray-700 dark:text-gray-300 text-center">
          <p>
            &copy; {new Date().getFullYear()} ChatEasy. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}