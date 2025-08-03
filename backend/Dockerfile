# Gunakan base image Ubuntu
FROM ubuntu:22.04

# Non-interaktif untuk menghindari prompt saat install
ENV DEBIAN_FRONTEND=noninteractive

# Install curl dan Node.js 22
RUN apt-get update && \
    apt-get install -y curl gnupg ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Tentukan direktori kerja
WORKDIR /app

# Salin file dependency
COPY package*.json ./

# Install dependencies production
RUN npm ci --only=production

# Salin seluruh source code
COPY . .

# Set NODE_ENV
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "index.js"]
