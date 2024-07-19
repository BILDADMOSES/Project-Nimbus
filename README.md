# <p align = "center"> 🌍✨ chatEasy 🌍✨  </p>

Welcome to **chatEasy**, the instant messaging application designed to break down language barriers and bring friends from different corners of the world closer together. With real-time translation for messages and UI elements, chatEasy ensures a seamless communication experience where language is no longer a hurdle.

# 📜 Purpose

The purpose of chatEasy is to allow users from different nations to communicate effortlessly. By abstracting the translation process, users can send messages and interact with the application in their native language while receiving responses in a language they understand. This fosters genuine connections and friendships across diverse linguistic backgrounds.

# 🏗️ Structure
The project follows a standard Next.js application structure with additional directories for organization:
```bash
/project-nimbus
    │
    ├── app/
    │   ├── (auth)/
    │   │   ├── signin/
    │   │   │   └── page.tsx
    │   │   ├── signup/
    │   │   │   └── page.tsx
    │   ├── api/
    │   │   ├── auth/
    │   │   │   └── [...nextauth]/
    │   │   │       └── route.ts
    │   │   ├── chat/
    │   │   │   ├── create/
    │   │   │   │   └── route.ts
    │   │   │   ├── group/
    │   │   │   │   └── route.ts
    │   │   │   ├── invite/
    │   │   │   │   └── route.ts
    │   │   │   └── join/
    │   │   │       └── route.ts
    │   │   ├── user/
    │   │   │   ├── language/
    │   │   │   │   └── route.ts
    │   │   │   └── profile/
    │   │   │       └── route.ts
    │   ├── chat/
    │   │   ├── ai/
    │   │   │   └── [sessionId]/
    │   │   │       └── page.tsx
    │   │   ├── group/
    │   │   │   └── [groupId]/
    │   │   │       └── page.tsx
    │   │   ├── one-on-one/
    │   │   │   └── [conversationId]/
    │   │   │       └── page.tsx
    │   ├── create-chat/
    │   │   └── page.tsx
    │   ├── join-chat/
    │   │   └── page.tsx
    │   ├── language-selection/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── profile/
    │   │   └── page.tsx
    │   ├── favicon.ico
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    │
    ├── components/
    │   ├── chat/
    │   │   ├── Chat.tsx
    │   │   ├── InvitationForm.tsx
    │   │   ├── MessageInput.tsx
    │   │   ├── MessageList.tsx
    │   │   └── RoomInfoDisplay.tsx
    │   ├── ChatroomCreator.tsx
    │   ├── common/
    │   │   ├── Footer.tsx
    │   │   ├── Header.tsx
    │   │   └── LoadingSpinner.tsx
    │   ├── language/
    │   │   └── LanguageSelector.tsx
    │   └── user/
    │       └── UserProfileForm.tsx
    │
    ├── hooks/
    │   ├── useAIChat.ts
    │   ├── useAuth.ts
    │   ├── useTranslation.ts
    │   └── useWebsocket.ts
    │
    ├── lib/
    │   ├── storage/
    │   │   ├── firebase.config.ts
    │   │   └── firebase.ts
    │   ├── utils/
    │   │   ├── aiChat.ts
    │   │   ├── invitationToken.ts
    │   │   ├── password.ts
    │   │   ├── translation.ts
    │   │   └── validation.ts
    │
    ├── prisma/
    │   ├── index.ts
    │   ├── middleware.ts
    │   └── schema.prisma
    │
    ├── public/
    │   ├── next.svg
    │   └── vercel.svg
    │
    ├── .env
    ├── .eslintrc.json
    ├── .gitignore
    ├── next-env.d.ts
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs
    ├── README.md
    ├── server.ts
    ├── server/
    │   └── websocket.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── tsconfig.server.json
    └── types/
        ├── chat.ts
        ├── index.ts
        └── language.ts
```

- `.env`, `.eslintrc.json`, `.gitignore`: Configuration files
- `app/`: Next.js app directory
  - `(auth)/`: Authentication pages (sign-in and sign-up)
  - `api/`: API routes for authentication, chat, and user management
  - `chat/`: Chat pages for one-on-one, group, and AI chats
  - `create-chat/`, `join-chat/`: Pages for creating and joining chats
  - `language-selection/`: Language selection page and layout
  - `profile/`: User profile page
  - `layout.tsx`, `page.tsx`: App-level layout and homepage
- `components/`: Reusable components for chat, common UI elements, language selection, and user profile
- `hooks/`: Custom hooks for AI chat, authentication, translation, and websockets
- `lib/`: Utility functions and Firebase configuration
- `prisma/`: Prisma schema and middleware
- `public/`: Public assets (icons and images)
- `server/`: Server-side code for websockets
- `types/`: TypeScript type definitions for chat, language, and index
- `tailwind.config.ts`, `tsconfig.json`, `tsconfig.server.json`: Tailwind CSS and TypeScript configuration files

Please note that the project structure may change as development is ongoing. Always refer to the most recent version of the project for the accurate structure.

# 🔧 How We Solve the Problem

chatEasy tackles the language barrier challenge with these innovative solutions:

1) **Real-Time Translation**: Messages are instantly translated as they are sent and received, ensuring smooth communication without delays.

2) **Localized UI**: The application interface adapts to the user's preferred language, making it intuitive and user-friendly.

3) **Seamless Integration**: The translation service is seamlessly integrated into the backend, abstracting the complexity from the end-user.
   
By leveraging cutting-edge AI and machine learning technologies, chatEasy provides an experience where users can interact as if they are speaking the same language, regardless of their geographical and linguistic differences.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
