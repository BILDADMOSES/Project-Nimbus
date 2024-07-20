"use client";
import { motion } from 'framer-motion';
import { useCreateChat } from '@/hooks/useCreateChat';
import { LanguageSelect } from '@/components/LanguageSelect';
import { ChatTypeSelect } from '@/components/ChatTypeSelect';
import { InviteMember } from '@/components/InviteMember';

const CreateChatForm = () => {
  const { 
    step, 
    language, 
    chatType, 
    inviteEmails,
    inviteLink,
    handleLanguageSelect,
    handleChatTypeSelect,
    handleAddInviteMember,
    handleRemoveInviteMember,
    sendInvitations,
    handleNext,
    handleBack,
    isLastStep
  } = useCreateChat();

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card w-full md:w-4/5 lg:w-3/5 bg-base-100 shadow-xl">
        <div className="card-body flex flex-col md:flex-row">
          {/* Left Column - Multi-step Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2 p-4 md:p-8 overflow-auto"
            style={{ maxHeight: '80vh' }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">Create Your Chat</h1>
            
            {step === 1 && (
              <LanguageSelect 
                selectedLanguage={language}
                onSelect={handleLanguageSelect}
              />
            )}

            {step === 2 && (
              <ChatTypeSelect
                selectedType={chatType}
                onSelect={handleChatTypeSelect}
              />
            )}

            {step === 3 && chatType !== 'ai' && (
              <InviteMember
                emails={inviteEmails}
                onAdd={handleAddInviteMember}
                onRemove={handleRemoveInviteMember}
                inviteLink={inviteLink}
                isOneOnOne={chatType === 'oneOnOne'}
                onSendInvitations={sendInvitations}
              />
            )}

            {step === 3 && chatType === 'ai' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Chat with AI</h2>
                <p>You're all set! Click 'Finish' to start chatting with our AI language partner.</p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="btn btn-secondary w-24"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="btn btn-primary ml-auto w-24"
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            </div>
          </motion.div>
          
          {/* Right Column - Chat Interface Illustration */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2 p-4 md:p-8 flex justify-center items-center bg-base-200 rounded-xl"
          >
            <div className="w-full max-w-md flex flex-col items-center">
              <div className="w-full bg-base-100 rounded-lg shadow-xl overflow-hidden mb-6 md:mb-8">
                {/* Chat app header */}
                <div className="bg-primary text-primary-content p-3 md:p-4 text-center">
                  <h3 className="font-semibold text-sm md:text-base">Multilingual Chat</h3>
                </div>
                
                {/* Chat messages */}
                <div className="p-3 md:p-4 bg-base-200 space-y-3 md:space-y-4 h-64 md:h-80 overflow-y-auto">
                  {/* Sender's message */}
                  <div className="chat chat-end">
                    <div className="chat-bubble chat-bubble-primary">
                      Hello! Can you understand me?
                    </div>
                  </div>
                  
                  {/* Receiver's message */}
                  <div className="chat chat-start">
                    <div className="chat-bubble chat-bubble-secondary">
                      Oui, je comprends parfaitement !
                    </div>
                  </div>
                  
                  {/* Sender's message */}
                  <div className="chat chat-end">
                    <div className="chat-bubble chat-bubble-primary">
                      Great! The translation works well.
                    </div>
                  </div>
                  
                  {/* Receiver's message */}
                  <div className="chat chat-start">
                    <div className="chat-bubble chat-bubble-secondary">
                      C'est vraiment impressionnant !
                    </div>
                  </div>
                </div>
                
                {/* Chat input */}
                <div className="p-3 md:p-4 border-t">
                  <div className="flex rounded-full bg-base-200 p-2">
                    <input type="text" placeholder="Type in any language..." className="input input-ghost flex-grow bg-transparent outline-none px-2 text-sm md:text-base" />
                    <button className="btn btn-circle btn-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center">Break language barriers effortlessly</h2>
              <p className="text-base-content text-center text-sm md:text-base">Connect with anyone, regardless of language.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>

  );
};

export default CreateChatForm;
