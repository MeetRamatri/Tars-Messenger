# Tars Messenger 💬

Tars Messenger is a real-time chat application built with Next.js, Clerk for authentication, and Convex for the backend database and real-time syncing. 

## 🚀 Features

- **Real-time Messaging**: Instant message delivery and updates powered by Convex.
- **User Authentication**: Secure authentication and user management with Clerk.
- **Presence Tracking**: See when users are online in real-time.
- **Group Chats & Direct Messages**: Support for both 1-on-1 and multi-participant conversations.
- **Typing Indicators**: Real-time typing status for participants.
- **Message Reactions**: React to messages with emojis.
- **Message Deletion**: Ability to soft-delete messages.
- **Modern UI**: Styled with Tailwind CSS and Radix UI components.

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (Avatar, Scroll Area, etc.)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Backend & Database**: [Convex](https://www.convex.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, yarn, pnpm, or bun

You will also need to set up accounts for:
- [Clerk](https://clerk.com/) (For Authentication)
- [Convex](https://www.convex.dev/) (For Backend/Database)

## 💻 Getting Started

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd Tars-Messenger
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory and add your Clerk and Convex keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   CONVEX_DEPLOYMENT=your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   ```

4. **Start the Convex development server**:
   In a separate terminal, run:
   ```bash
   npx convex dev
   ```

5. **Start the Next.js development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components.
- `/convex`: Convex backend functions and database schema.
- `/lib`: Utility functions and helpers.
