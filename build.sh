#!/bin/bash

# Chrome ve gerekli bağımlılıkları yükle
echo "Installing Chrome for Puppeteer..."

# Chrome indirme URL'i
CHROME_URL="https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb"

# Chrome'u indir ve yükle
curl -sSL $CHROME_URL -o chrome.deb
dpkg -i chrome.deb || apt-get install -f -y
rm chrome.deb

echo "Chrome installation completed"
echo "Chrome path: $(which google-chrome-stable)"

# Node.js bağımlılıklarını yükle
cd server
npm install

echo "Build completed successfully"
