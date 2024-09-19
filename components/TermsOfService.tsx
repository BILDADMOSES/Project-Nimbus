import { motion } from 'framer-motion';

export default function TermsOfService () {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using the ChatEasy application ('App'), you agree to be bound by these Terms and Conditions ('Terms'). If you do not agree to these Terms, please do not use the App."
    },
    {
      title: "2. Description of Service",
      content: "ChatEasy provides users with a platform for multilingual communication, including real-time text, voice, and video translations ('Services'). The App utilizes third-party translation services, including but not limited to Google Translate, as well as custom language models developed by our team."
    },
    {
      title: "3. User Obligations",
      content: [
        "Compliance: You agree to use the App in compliance with all applicable laws and regulations.",
        "Accuracy of Information: You are responsible for the accuracy of any information you provide through the App. ChatEasy is not liable for any errors or omissions in the content you submit.",
        "Prohibited Use: You agree not to use the App for any illegal, harmful, or abusive purposes, including but not limited to sharing sensitive or confidential information that may result in legal liability."
      ]
    },
    {
      title: "4. Translation Services",
      content: [
        "Third-Party Services: ChatEasy uses third-party services, including Google Translate, for language translation. While we strive to provide accurate translations, we do not guarantee the accuracy, reliability, or completeness of any translation.",
        "Custom Language Models: For certain languages, ChatEasy may use custom translation models developed by our team. These models are continuously improved, but they may still contain errors.",
        "Disclaimer: Translations provided by the App are for informational purposes only. ChatEasy is not responsible for any damages or losses that may arise from the use of inaccurate or incomplete translations, particularly for sensitive or critical information."
      ]
    },
    {
      title: "5. Limitation of Liability",
      content: [
        "General: To the maximum extent permitted by law, ChatEasy and its affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the App.",
        "Sensitive Information: Users are advised against uploading or sharing sensitive or confidential information through the App. ChatEasy shall not be liable for any issues arising from the misuse of such information."
      ]
    },
    {
      title: "6. User Consent",
      content: "By using ChatEasy, you consent to the collection, storage, and processing of your data as described in our Privacy Policy. You also acknowledge that translations may not be 100% accurate and agree to use the App at your own risk."
    },
    {
      title: "7. Intellectual Property",
      content: "All content, including but not limited to text, graphics, logos, and software, is the property of ChatEasy or its licensors and is protected by copyright, trademark, and other intellectual property laws."
    },
    {
      title: "8. Modifications to the Service",
      content: "ChatEasy reserves the right to modify or discontinue the App, or any part thereof, with or without notice. We shall not be liable to you or any third party for any modifications, suspensions, or discontinuations of the Service."
    },
    {
      title: "9. Termination",
      content: "We reserve the right to terminate or suspend your access to the App, with or without notice, if we believe you have violated these Terms."
    },
    {
      title: "10. Governing Law",
      content: "These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law principles."
    },
    {
      title: "11. Dispute Resolution",
      content: "Any disputes arising from or relating to these Terms or your use of the App shall be resolved through binding arbitration in accordance with the rules of the Nairobi Centre for International Arbitration. The arbitration shall take place in Nairobi, Kenya, and shall be conducted in English."
    },
    {
      title: "12. User Account",
      content: "You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account or any other breach of security."
    },
    {
      title: "13. Privacy",
      content: "Your use of the App is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding the collection and use of your personal information."
    },
    {
      title: "14. Miscellaneous",
      content: [
        "Severability: If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
        "Entire Agreement: These Terms, along with our Privacy Policy, constitute the entire agreement between you and ChatEasy regarding your use of the App.",
        "Assignment: ChatEasy may assign or transfer these Terms, in whole or in part, without restriction. You may not assign or transfer any rights or obligations under these Terms without ChatEasy's prior written consent.",
        "No Waiver: The failure of ChatEasy to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision."
      ]
    },
    {
      title: "15. Contact Information",
      content: "If you have any questions or concerns about these Terms, please contact us at support@chateasy.com."
    }
  ];

  return (
    <div className="min-h-screen bg-base-100/90 text-base-content p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-primary">ChatEasy Terms of Service</h1>
        {/* <p className="mb-8 text-lg">Last updated: {new Date().toLocaleDateString()}</p> */}
        {sections.map((section, index) => (
          <motion.section
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold mb-4 text-secondary">{section.title}</h2>
            {Array.isArray(section.content) ? (
              <ul className="list-disc list-inside space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="text-base-content/80">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-base-content/80">{section.content}</p>
            )}
          </motion.section>
        ))}
      </motion.div>
    </div>
  );
};