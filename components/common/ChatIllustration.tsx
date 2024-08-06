import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Message {
  sender: string;
  receiver: string;
}

const messages: { [key: string]: Message[] } = {
  english: [
    {
      sender: "Hello! Can you understand me?",
      receiver: "Yes, I understand perfectly!",
    },
    {
      sender: "Great! The translation works well.",
      receiver: "It's really impressive!",
    },
  ],
  swahili: [
    {
      sender: "Habari! Unaweza kunielewa?",
      receiver: "Ndio, ninaelewa kabisa!",
    },
    {
      sender: "Nzuri! Tafsiri inafanya kazi vizuri.",
      receiver: "Hii ni ya kushangaza!",
    },
  ],
  french: [
    {
      sender: "Bonjour! Peux-tu me comprendre?",
      receiver: "Oui, je comprends parfaitement !",
    },
    {
      sender: "Super! La traduction fonctionne bien.",
      receiver: "C'est vraiment impressionnant !",
    },
  ],
};

const languages = ["english", "swahili", "french"];

const ChatIllustration: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>("english");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguage((prevLanguage) => {
        const currentIndex = languages.indexOf(prevLanguage);
        const nextIndex = (currentIndex + 1) % languages.length;
        return languages[nextIndex];
      });
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const currentMessages: Message[] = messages[currentLanguage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-4 md:p-8 flex justify-center items-center rounded-r-2xl"
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full bg-base-100 rounded-lg shadow-xl overflow-hidden mb-6 md:mb-8">
          {/* Chat app header */}
          <div className="bg-primary text-primary-content p-3 md:p-4 text-center">
            <h3 className="font-semibold text-sm md:text-base">
              Multilingual Chat
            </h3>
          </div>

          {/* Chat messages */}
          <div className="p-3 md:p-4 bg-base-200 space-y-3 md:space-y-4 h-64 md:h-80 overflow-y-auto">
            {currentMessages.map((message, index) => (
              <React.Fragment key={index}>
                <div className="chat chat-end">
                  <div className="chat-bubble chat-bubble-primary">
                    {message.sender}
                  </div>
                </div>
                <div className="chat chat-start">
                  <div className="chat-bubble chat-bubble-secondary">
                    {message.receiver}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Chat input */}
          <div className="p-3 md:p-4 border-t border-base-300">
            <div className="flex rounded-full bg-base-200 p-2">
              <input
                type="text"
                placeholder="Type in any language..."
                className="flex-grow bg-transparent outline-none px-2 text-sm md:text-base"
              />
              <button className="btn btn-circle btn-primary btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-4 h-4 md:w-5 md:h-5 translate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center text-base-content">
          Break language barriers effortlessly
        </h2>
        <p className="text-base-content/70 text-center text-sm md:text-base">
          Connect with anyone, regardless of language.
        </p>
      </div>
    </motion.div>
  );
};

export default ChatIllustration;
