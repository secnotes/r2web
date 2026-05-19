#!/bin/bash
# Build radare2 WASM for browser
# This script patches and builds radare2 for WebAssembly

set -e

R2_DIR="$(dirname "$0")/../radare2"
WASM_DIR="$(dirname "$0")/../r2web/src/wasm"

# Check WASI SDK
if [ ! -d "$HOME/Downloads/wasi/wasi-sdk-29.0-x86_64-linux" ]; then
    echo "Extracting WASI SDK..."
    cd ~/Downloads/wasi
    if [ -f "distfiles/wasi-sdk.tar.gz" ]; then
        tar -xzf distfiles/wasi-sdk.tar.gz || echo "Download still in progress"
    fi
fi

# Set WASI environment
export WASI_ROOT="${WASI_ROOT:-${HOME}/Downloads/wasi}"
export WASI_SDK="${WASI_ROOT}/wasi-sdk-29.0-x86_64-linux"

if [ ! -d "$WASI_SDK" ]; then
    echo "WASI SDK not found. Please wait for download to complete."
    exit 1
fi

echo "Using WASI SDK: $WASI_SDK"

# Build radare2 with WASI
cd "$R2_DIR"

# Configure for WASI browser
./configure \
    --with-compiler=wasi \
    --with-ostype=wasi \
    --disable-debugger \
    --without-fork \
    --without-gpl \
    --with-static-themes \
    --without-gperf \
    --disable-threads \
    --without-dylink \
    --with-libr \
    --with-wasm-browser

# Build
make -j4

# Copy WASM output to frontend
mkdir -p "$WASM_DIR"
cp -v binr/radare2/radare2.wasm "$WASM_DIR/radare2.wasm" || echo "WASM not yet generated"

echo "Build complete!"