# 🚀 Complete Setup Guide

This guide will walk you through setting up the AI Drive-Thru Voice Ordering System from scratch.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [OpenAI API Setup](#openai-api-setup)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Required
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (or **Bun** for faster performance)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Microphone**: Required for voice ordering

### Recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Display**: 1920x1080 or higher for optimal UI experience
- **Internet**: Stable broadband connection (5+ Mbps)

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd drive-thru-ai
```

### Step 2: Install Dependencies

**Using npm:**
```bash
npm install
```

**Using Bun (faster):**
```bash
bun install
```

### Step 3: Install WebSocket Server Dependencies

```bash
cd server
npm install
cd ..
```

### Step 4: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and configure:

```bash
# OpenAI API Key (Required for voice ordering)
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here

# WebSocket URL (default for local development)
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# WebSocket Port
WS_PORT=3001

# Environment
NODE_ENV=development
```

## OpenAI API Setup

### Step 1: Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Add payment method (Realtime API requires paid account)

### Step 2: Generate API Key

1. Navigate to [API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name it "Drive-Thru System"
4. Copy the key (starts with `sk-`)
5. Paste it in your `.env.local` file

### Step 3: Enable Realtime API Access

The Realtime API requires:
- **GPT-4o access** (paid account)
- **Sufficient credits** (~$0.06 per minute of audio)

Check your [usage limits](https://platform.openai.com/usage) to ensure you have access.

### Step 4: Test API Key

You can test your API key with curl:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

If successful, you'll see a list of available models.

## Running the Application

### Development Mode

You need **TWO terminal windows** running simultaneously:

#### Terminal 1: Next.js Development Server

```bash
npm run dev
# or
bun dev
```

This starts the Next.js app on `http://localhost:3000`

#### Terminal 2: WebSocket Server

```bash
cd server
npm start
# or
bun run websocket-server.ts
```

This starts the WebSocket server on `ws://localhost:3001`

### Verify Both Servers Are Running

You should see:

**Terminal 1:**
```
✓ Ready on http://localhost:3000
```

**Terminal 2:**
```
WebSocket server running on ws://localhost:3001
```

## Testing

### 1. Test Homepage

1. Open browser: `http://localhost:3000`
2. You should see the interface selector with two cards
3. Both cards should have smooth animations

### 2. Test Customer Interface

1. Click "Customer Screen" or navigate to `/customer`
2. Click the language toggle (English/Arabic)
3. Click the microphone button
4. **Grant microphone permissions** when prompted
5. Speak an order (e.g., "I want a Big Mac and large fries")
6. Watch for:
   - Voice visualization bars moving
   - Transcript appearing
   - Order items being detected

### 3. Test Kitchen Dashboard

1. Navigate to `/kitchen`
2. Login with demo credentials:
   - Username: `admin`
   - Password: `password`
3. You should see:
   - Welcome message with your username
   - Order statistics
   - Sample orders in different statuses
4. Test order management:
   - Click "Start Preparing" on a pending order
   - Click "Mark as Ready" on a preparing order

### 4. Test Real-time Updates

1. Open TWO browser windows:
   - Window 1: Customer interface
   - Window 2: Kitchen dashboard
2. Place an order in Window 1
3. Verify it appears immediately in Window 2
4. Update order status in Window 2
5. Verify status updates appear in both windows

## Troubleshooting

### Issue: OpenAI Connection Failed

**Error**: "Failed to connect to voice service"

**Solutions**:
1. Check API key is correct in `.env.local`
2. Verify you have GPT-4o Realtime access
3. Check your OpenAI account has sufficient credits
4. Ensure `.env.local` is in the root directory
5. Restart the Next.js dev server after changing env vars

### Issue: Microphone Not Working

**Error**: "Failed to access microphone"

**Solutions**:
1. Grant microphone permissions in browser
2. Check system microphone is working (test in system settings)
3. Try a different browser
4. On macOS: System Preferences → Security & Privacy → Microphone
5. On Windows: Settings → Privacy → Microphone

### Issue: WebSocket Connection Failed

**Error**: "WebSocket error" or "Connection error"

**Solutions**:
1. Verify WebSocket server is running (Terminal 2)
2. Check port 3001 is not in use by another app:
   ```bash
   lsof -i :3001  # macOS/Linux
   netstat -ano | findstr :3001  # Windows
   ```
3. Check `NEXT_PUBLIC_WS_URL` in `.env.local`
4. Restart WebSocket server

### Issue: Orders Not Appearing

**Solutions**:
1. Check both servers are running
2. Open browser console (F12) for error messages
3. Verify WebSocket connection is established
4. Clear browser cache and reload

### Issue: Animations Laggy

**Solutions**:
1. Close other browser tabs
2. Check CPU usage (close heavy apps)
3. Try a different browser (Chrome recommended)
4. Update graphics drivers
5. Lower browser zoom level to 100%

### Issue: Build Errors

**Error**: "Module not found" or similar

**Solutions**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Port Already in Use

**Error**: "Port 3000 is already in use"

**Solutions**:
```bash
# macOS/Linux - Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

## Performance Optimization

### For Better Performance:

1. **Use Bun instead of npm**:
```bash
curl -fsSL https://bun.sh/install | bash
bun install
bun dev
```

2. **Enable GPU acceleration** in browser:
   - Chrome: `chrome://settings/system` → Enable hardware acceleration

3. **Close unnecessary tabs** to free up memory

4. **Use production build** for testing:
```bash
npm run build
npm start
```

## Browser Compatibility

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome | ✅ Yes | Recommended - Best performance |
| Firefox | ✅ Yes | Good performance |
| Safari | ✅ Yes | macOS only |
| Edge | ✅ Yes | Windows recommended |
| Opera | ✅ Yes | Based on Chrome |

**Minimum Versions:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Next Steps

After successful setup:

1. **Customize the menu** in `src/lib/openai-realtime.ts`
2. **Update branding** (colors, logos, text)
3. **Add database** for persistent storage
4. **Implement real authentication**
5. **Deploy to production**

## Getting Help

If you're still having issues:

1. Check the [README.md](README.md) for more info
2. Search existing GitHub issues
3. Create a new issue with:
   - Your OS and Node version
   - Complete error message
   - Steps to reproduce
   - Console logs (F12 → Console)

## Useful Commands

```bash
# Development
npm run dev              # Start Next.js dev server
cd server && npm start   # Start WebSocket server

# Production
npm run build           # Build for production
npm start              # Start production server

# Maintenance
npm run lint           # Check code quality
npm run type-check     # Check TypeScript types (if configured)

# Troubleshooting
rm -rf .next           # Clear Next.js cache
rm -rf node_modules    # Remove dependencies
npm install            # Reinstall dependencies
```

---

**Happy coding! 🚀** If you encounter any issues not covered here, please open a GitHub issue.