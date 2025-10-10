# ⚡ Quick Start Guide

Get the AI Drive-Thru system running in 5 minutes!

## 🎯 Prerequisites

- Node.js 18+ or Bun installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Modern browser with microphone

## 🚀 Installation (3 steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your OpenAI API key
# NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Start Servers

Open **2 terminals**:

**Terminal 1** - Next.js:
```bash
npm run dev
```

**Terminal 2** - WebSocket Server:
```bash
npm run ws:dev
```

## 🎉 That's it!

Open your browser: **http://localhost:3000**

## 🧪 Quick Test

### Test Customer Screen
1. Click "Customer Screen"
2. Click microphone button
3. Allow microphone access
4. Say: "I want a Big Mac and large fries"
5. Watch order appear!

### Test Kitchen Dashboard
1. Open new tab: **http://localhost:3000/kitchen**
2. Login: `admin` / `password`
3. See orders appear in real-time!

## 🔧 Common Issues

### "Failed to connect to voice service"
- Check your OpenAI API key in `.env.local`
- Ensure you have GPT-4o Realtime access
- Restart Next.js server: `Ctrl+C` then `npm run dev`

### "Microphone not working"
- Grant microphone permissions in browser
- Check system microphone is working

### "WebSocket connection failed"
- Ensure WebSocket server is running (Terminal 2)
- Check Terminal 2 shows: `WebSocket server running on ws://localhost:3001`

## 📚 Next Steps

- Read [SETUP.md](SETUP.md) for detailed setup
- Check [README.md](README.md) for full documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

## 🆘 Need Help?

1. Check error messages in browser console (F12)
2. Look at terminal logs
3. Read [SETUP.md](SETUP.md) troubleshooting section
4. Open a GitHub issue

---

**Enjoy building! 🚀**