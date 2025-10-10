# 🎤 AI Drive-Thru Voice Ordering System

A premium, Apple-inspired voice ordering system for drive-thrus built with Next.js, React, TypeScript, and OpenAI's Realtime API.

![Drive-Thru AI](https://images.unsplash.com/photo-1556742111-a301076d9d18?w=1200&h=400&fit=crop)

## ✨ Features

### 🎯 Customer Interface
- **Voice Ordering**: OpenAI Realtime API for natural voice conversations
- **Real-time Display**: Large, readable order display optimized for car windows
- **Bilingual Support**: Full English and Arabic support with RTL layout
- **Voice Visualization**: Beautiful Siri-like audio waveform animations
- **Smooth Animations**: 60fps Framer Motion animations throughout

### 👨‍🍳 Kitchen Dashboard
- **Real-time Orders**: Instant order notifications via WebSocket
- **Order Management**: Track orders through pending → preparing → ready
- **Staff Authentication**: Secure login system
- **Live Statistics**: Real-time order counts and status tracking
- **Responsive Design**: Works on tablets and desktop screens

### 🎨 Design
- **Apple-inspired**: Minimalist, premium aesthetic
- **Dark Theme**: Professional glassmorphism effects
- **Smooth Transitions**: Native-feeling animations
- **Large Typography**: Optimized for drive-thru visibility
- **Accessible**: WCAG compliant color contrast

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- OpenAI API key with GPT-4o Realtime access
- Modern browser with microphone access

### Installation

1. **Clone and install**:
```bash
git clone <your-repo>
cd drive-thru-ai
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key
```

3. **Start development servers** (requires 2 terminals):

Terminal 1 - Next.js:
```bash
npm run dev
```

Terminal 2 - WebSocket Server:
```bash
npm run ws:dev
```

4. **Open in browser**:
```
http://localhost:3000
```

## 📖 Full Setup Guide

See [SETUP.md](SETUP.md) for comprehensive setup instructions including:
- Detailed installation steps
- OpenAI API configuration
- Troubleshooting guide
- Performance optimization tips

## 🏗️ Project Structure

```
drive-thru-ai/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── customer/             # Customer voice interface
│   │   ├── kitchen/              # Kitchen dashboard
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   └── orders/           # Order management
│   │   └── page.tsx              # Homepage interface selector
│   ├── components/
│   │   ├── customer/             # Customer screen components
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── ListeningScreen.tsx
│   │   │   ├── OrderDisplay.tsx
│   │   │   └── ConfirmationScreen.tsx
│   │   ├── kitchen/              # Kitchen dashboard components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   └── KitchenDashboard.tsx
│   │   └── ui/                   # Shadcn UI components
│   ├── lib/
│   │   ├── openai-realtime.ts    # OpenAI integration
│   │   └── websocket-client.ts   # WebSocket client
│   └── hooks/
│       ├── useOpenAIRealtime.ts  # Voice ordering hook
│       └── useWebSocket.ts       # Real-time updates hook
├── server/
│   └── websocket-server.ts       # WebSocket server
├── public/                        # Static assets
└── .env.example                   # Environment template
```

## 🔧 Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Shadcn/UI**: High-quality component library

### Backend
- **Next.js API Routes**: RESTful endpoints
- **WebSocket Server**: Real-time updates (ws library)
- **OpenAI Realtime API**: Voice AI integration

### Infrastructure
- **WebSocket**: Real-time order synchronization
- **In-memory Storage**: Demo (replace with database for production)

## 🎮 Usage

### Customer Screen (`/customer`)

1. **Welcome Screen**: Select language (English/Arabic)
2. **Voice Ordering**: Tap microphone and speak your order
3. **Order Review**: View and modify items
4. **Confirmation**: Get order number and estimated time

### Kitchen Dashboard (`/kitchen`)

1. **Login**: Use credentials (demo: admin/password)
2. **View Orders**: See all orders by status
3. **Manage Orders**: Update status through workflow
4. **Track Time**: Monitor order preparation time

## 🔑 Environment Variables

Create `.env.local` with:

```env
# Required
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Optional (has defaults)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_PORT=3001
NODE_ENV=development
```

Get your OpenAI API key: https://platform.openai.com/api-keys

## 📱 Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Interface selector | Public |
| `/customer` | Voice ordering interface | Public |
| `/kitchen` | Kitchen dashboard | Login required |

## 🎨 Customization

### Update Menu Items

Edit `src/lib/openai-realtime.ts`:

```typescript
const menuItems = [
  { name: "Your Item", nameAr: "العربية", price: 9.99 },
  // Add more items...
];
```

### Change Theme Colors

Edit `src/app/globals.css`:

```css
:root {
  --primary: oklch(0.7 0.15 240); /* Blue accent */
  --secondary: oklch(0.25 0 0);   /* Dark gray */
  /* Customize more colors... */
}
```

### Modify Animations

Edit animation parameters in components using Framer Motion:

```tsx
<motion.div
  animate={{ scale: [1, 1.1, 1] }}
  transition={{ duration: 2 }}
/>
```

## 🧪 Testing

### Manual Testing

1. **Voice Recognition**: Test with various accents and languages
2. **Real-time Sync**: Open customer + kitchen screens simultaneously
3. **Mobile**: Test on tablets for kitchen dashboard
4. **Accessibility**: Test with screen readers and keyboard navigation

### Demo Credentials

- Username: `admin`
- Password: `password`

## 🚀 Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy WebSocket server separately (e.g., Railway, Render)

### Docker

```bash
# Build
docker build -t drive-thru-ai .

# Run
docker run -p 3000:3000 -p 3001:3001 drive-thru-ai
```

### Production Checklist

- [ ] Use real database (PostgreSQL, MongoDB)
- [ ] Implement proper authentication (NextAuth, Clerk)
- [ ] Use WSS (secure WebSocket)
- [ ] Set up SSL certificates
- [ ] Configure CORS properly
- [ ] Add error tracking (Sentry)
- [ ] Set up logging
- [ ] Implement rate limiting
- [ ] Add order persistence
- [ ] Test payment integration (if needed)

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your university capstone or commercial projects.

## 🙏 Acknowledgments

- **OpenAI**: Realtime API for voice recognition
- **Vercel**: Next.js framework and hosting
- **Shadcn**: Beautiful UI components
- **Framer**: Motion animation library

## 📞 Support

Having issues? Check:

1. [SETUP.md](SETUP.md) - Comprehensive setup guide
2. [GitHub Issues](../../issues) - Report bugs or request features
3. [OpenAI Docs](https://platform.openai.com/docs) - API documentation

## 🎓 University Capstone Project

This system was built as a comprehensive university capstone project demonstrating:

- Modern web development practices
- Real-time systems architecture
- AI/ML integration
- UX/UI design principles
- Full-stack development
- API integration
- Bilingual application development

Perfect for showcasing skills in:
- React/Next.js
- TypeScript
- Real-time WebSocket communication
- Voice AI integration
- Responsive design
- Animation and UX

---

Built with ❤️ for university capstone project

**Star ⭐ this repo if you find it useful!**