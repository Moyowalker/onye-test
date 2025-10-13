# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Set environment variables for development
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Install dependencies as root first
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create .next directory and set proper ownership
RUN mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]