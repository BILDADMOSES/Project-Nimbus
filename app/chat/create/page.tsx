"use client";
import { motion } from "framer-motion";
import { useCreateChat } from "@/hooks/useCreateChat";
import { LanguageSelect } from "@/components/LanguageSelect";
import { ChatTypeSelect } from "@/components/ChatTypeSelect";
import { InviteMember } from "@/components/InviteMember";
import ChatIllustration from "@/components/common/ChatIllustration";

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
    isLastStep,
  } = useCreateChat();

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <div className="card w-full md:w-4/5  bg-base-100 shadow-xl">
        <div className="card-body flex flex-col md:flex-row">
          {/* Left Column - Multi-step Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2 p-4 md:p-8 overflow-auto"
            style={{ maxHeight: "80vh" }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
              Create Your Chat
            </h1>

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

            {step === 3 && chatType !== "ai" && (
              <InviteMember
                emails={inviteEmails}
                onAdd={handleAddInviteMember}
                onRemove={handleRemoveInviteMember}
                inviteLink={inviteLink}
                isOneOnOne={chatType === "oneOnOne"}
                onSendInvitations={sendInvitations}
              />
            )}

            {step === 3 && chatType === "ai" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Chat with AI</h2>
                <p>
                  You're all set! Click 'Finish' to start chatting with our AI
                  language partner.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {step > 1 && (
                <button onClick={handleBack} className="btn btn-secondary w-24">
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="btn btn-primary ml-auto w-24"
              >
                {isLastStep ? "Finish" : "Next"}
              </button>
            </div>
          </motion.div>

          {/* Right Column - Chat Interface Illustration */}
          <ChatIllustration />
        </div>
      </div>
    </div>
  );
};

export default CreateChatForm;
