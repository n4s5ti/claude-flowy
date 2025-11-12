# Agentic Jujutsu - Compatibility Guide

## 🔍 Understanding Compatibility

Agentic Jujutsu uses a **native addon** (Rust + N-API) for high-performance operations. This requires specific system dependencies.

## ⚙️ System Requirements

### Required
- **Node.js**: 16.0.0 or higher
- **GLIBC**: 2.32 or higher (Linux)
- **Platform**: Linux x64, macOS (arm64/x64), Windows x64

### Current Environment Status

```bash
# Check your GLIBC version
ldd --version

# Expected output for compatibility:
# ldd (GNU libc) 2.32 or higher

# Current Codespaces environment:
# ldd (GNU libc) 2.31 ❌ (incompatible)
```

## 🚨 Compatibility Error

If you see this error:

```
[agentic-jujutsu] Native addon not available on this system.
[agentic-jujutsu] This may be due to GLIBC version requirements (2.32+)
[agentic-jujutsu] Error: version `GLIBC_2.32' not found
```

**This means:**
- The native Rust/N-API addon cannot load
- Core functionality (ReasoningBank, AgentDB) is unavailable
- CLI commands will fail
- JavaScript API will not work

## ✅ Supported Platforms

### ✅ Fully Supported

| Platform | Architecture | GLIBC | Status |
|----------|--------------|-------|--------|
| Linux | x86_64 | 2.32+ | ✅ Full support |
| macOS | arm64 (Apple Silicon) | N/A | ✅ Full support |
| macOS | x64 (Intel) | N/A | ✅ Full support |
| Windows | x64 | N/A | ✅ Full support |

### ❌ Incompatible Environments

| Environment | Reason | Workaround |
|-------------|--------|------------|
| GitHub Codespaces (default) | GLIBC 2.31 | Use local dev or upgrade |
| Ubuntu 18.04 | GLIBC 2.27 | Upgrade to Ubuntu 20.04+ |
| Debian 10 | GLIBC 2.28 | Upgrade to Debian 11+ |
| CentOS 7 | GLIBC 2.17 | Upgrade to CentOS 8+ |
| Alpine Linux | musl libc (not GLIBC) | Use glibc-based distro |

## 🔧 Solutions

### Option 1: Upgrade System (Recommended)

**For Ubuntu/Debian:**
```bash
# Check current version
cat /etc/os-release

# Upgrade to Ubuntu 20.04+ or Debian 11+
# This provides GLIBC 2.32+
```

**For Codespaces:**
```json
// .devcontainer/devcontainer.json
{
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu-22.04",
  // Ubuntu 22.04 has GLIBC 2.35
}
```

### Option 2: Use Local Development

Run on your local machine with compatible OS:
- macOS 11+ (any Mac from 2020+)
- Windows 10/11
- Linux with GLIBC 2.32+

### Option 3: Docker Container

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    nodejs npm git

RUN npm install -g agentic-jujutsu

# GLIBC 2.35 - fully compatible
```

### Option 4: Use Mock/Demo Mode

For learning and demonstration without native features:

```javascript
// Use the compatibility demo instead
node examples/agentic-jujutsu-demo/compatibility-demo.js
```

## 🧪 Testing Compatibility

### Quick Check Script

```bash
#!/bin/bash
echo "=== Agentic Jujutsu Compatibility Check ==="
echo

# Check GLIBC version
echo "1. GLIBC Version:"
ldd --version | head -n 1
GLIBC_VERSION=$(ldd --version | head -n 1 | grep -oP '\d+\.\d+' | head -n 1)
echo "   Found: $GLIBC_VERSION"

if [ "$(printf '%s\n' "2.32" "$GLIBC_VERSION" | sort -V | head -n1)" = "2.32" ]; then
    echo "   ✅ Compatible (2.32+)"
else
    echo "   ❌ Incompatible (need 2.32+)"
fi
echo

# Check Node.js version
echo "2. Node.js Version:"
node --version
echo

# Check platform
echo "3. Platform:"
uname -a
echo

# Try loading the package
echo "4. Package Test:"
npx agentic-jujutsu@latest version 2>&1 | grep -E "(Native addon|version)"
echo

echo "=== End Compatibility Check ==="
```

Save as `check-compatibility.sh` and run:
```bash
chmod +x check-compatibility.sh
./check-compatibility.sh
```

## 📊 Feature Availability

| Feature | Native Addon Required | Fallback Available |
|---------|----------------------|-------------------|
| Basic VCS operations | ✅ | ❌ |
| ReasoningBank learning | ✅ | ❌ |
| AgentDB tracking | ✅ | ❌ |
| Quantum fingerprints | ✅ | ❌ |
| Pattern discovery | ✅ | ❌ |
| AI suggestions | ✅ | ❌ |
| Multi-agent coordination | ✅ | ❌ |
| CLI commands | ✅ | ❌ |
| Documentation/demos | ❌ | ✅ (mock mode) |

## 🎯 What Works in Compatibility Mode

### ✅ Available
- Reading documentation
- Running conceptual demos (`compatibility-demo.js`)
- Understanding architecture
- Learning API patterns
- Viewing mock data examples

### ❌ Not Available
- Actual VCS operations
- ReasoningBank learning
- Pattern discovery
- AI suggestions
- Quantum security features
- Multi-agent coordination
- Performance benchmarks

## 🚀 Production Deployment

### Recommended Platforms

**Best Performance:**
1. **Ubuntu 22.04 LTS** - GLIBC 2.35, stable, well-tested
2. **macOS 13+ (Ventura)** - Native Apple Silicon or Intel
3. **Windows 11** - WSL2 with Ubuntu 22.04

**Cloud Providers:**
- **AWS**: Amazon Linux 2023, Ubuntu 22.04 AMI
- **Google Cloud**: Ubuntu 22.04 LTS images
- **Azure**: Ubuntu 22.04 LTS VMs
- **DigitalOcean**: Ubuntu 22.04 droplets

**Containers:**
```dockerfile
# Use Ubuntu 22.04 base
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    nodejs npm git curl

# Install agentic-jujutsu
RUN npm install -g agentic-jujutsu

# Verify installation
RUN npx agentic-jujutsu version
```

### CI/CD Environments

**GitHub Actions:**
```yaml
jobs:
  test:
    runs-on: ubuntu-22.04  # GLIBC 2.35
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install agentic-jujutsu
      - run: npx agentic-jujutsu version
```

**GitLab CI:**
```yaml
image: ubuntu:22.04

test:
  script:
    - apt-get update && apt-get install -y nodejs npm
    - npm install agentic-jujutsu
    - npx agentic-jujutsu version
```

## 🔍 Debugging

### Check Loaded Libraries

```bash
# See what libraries the native addon needs
ldd node_modules/agentic-jujutsu/agentic-jujutsu.linux-x64-gnu.node

# Look for GLIBC version requirements
readelf -V node_modules/agentic-jujutsu/agentic-jujutsu.linux-x64-gnu.node | grep GLIBC
```

### Verbose Error Output

```bash
# Get detailed error information
NODE_DEBUG=module npx agentic-jujutsu status 2>&1 | grep -A 10 "GLIBC"
```

## 📚 Additional Resources

- **Package Docs**: https://npmjs.com/package/agentic-jujutsu
- **GitHub Issues**: https://github.com/ruvnet/agentic-flow/issues
- **GLIBC Info**: https://www.gnu.org/software/libc/
- **Node N-API**: https://nodejs.org/api/n-api.html

## 💡 FAQ

**Q: Why does it need GLIBC 2.32+?**
A: The native addon uses modern Rust features that compile against GLIBC 2.32+ for optimal performance.

**Q: Can I use it on Alpine Linux?**
A: No, Alpine uses musl libc instead of GLIBC. Use a glibc-based distro.

**Q: Will there be a pure JavaScript version?**
A: The performance benefits come from the native addon. Pure JS would lose the 23x speed advantage.

**Q: Can I contribute a musl build?**
A: Yes! PRs welcome at https://github.com/ruvnet/agentic-flow

**Q: What about Windows?**
A: Windows builds don't use GLIBC and should work on Windows 10/11.

## ✅ Recommendation

For the best experience with agentic-jujutsu:

1. **Use Ubuntu 22.04+** for production
2. **Use macOS 13+** for local development
3. **Use Docker** with Ubuntu 22.04 for consistent environments
4. **Avoid GitHub Codespaces** (default image) - use custom devcontainer

---

**Status**: Active maintenance
**Last Updated**: November 2025
**Package Version**: 2.3.3
