# 📤 Quick Upload Checklist for ChatGPT

## ✅ **INCLUDE THESE:**

### Core Files:
- [ ] `package.json`
- [ ] `README.md`
- [ ] `tsconfig.json`
- [ ] `next.config.mjs`
- [ ] `tailwind.config.ts`
- [ ] `.env.example` (NOT .env!)

### Source Code:
- [ ] `src/app/` (relevant pages)
- [ ] `src/components/` (relevant components)
- [ ] `src/lib/` (utilities)
- [ ] `prisma/schema.prisma`

### Documentation:
- [ ] Project overview/README
- [ ] Relevant feature docs

---

## ❌ **NEVER INCLUDE:**

### Sensitive:
- [ ] ❌ `.env` file
- [ ] ❌ API keys
- [ ] ❌ Passwords
- [ ] ❌ Database credentials
- [ ] ❌ Authentication tokens

### Generated/Large:
- [ ] ❌ `node_modules/`
- [ ] ❌ `.next/`
- [ ] ❌ `dist/` or `build/`
- [ ] ❌ `package-lock.json`
- [ ] ❌ `.git/`

### Temporary:
- [ ] ❌ `test-*.js`
- [ ] ❌ `check-*.js`
- [ ] ❌ `*.log`
- [ ] ❌ `*.db` files
- [ ] ❌ Backup folders

---

## 🎯 **QUICK RULES:**

1. **If it contains secrets** → ❌ Don't upload
2. **If it's generated** → ❌ Don't upload  
3. **If it's needed to understand issue** → ✅ Upload
4. **If it's from `npm install`** → ❌ Don't upload

---

## 📦 **RECOMMENDED UPLOAD:**

For this project, upload:
```
✅ package.json
✅ README.md
✅ .env.example
✅ prisma/schema.prisma
✅ src/app/ (zip)
✅ src/components/ (zip)
✅ src/lib/
✅ Relevant config files
```

**NEVER upload:**
```
❌ .env
❌ node_modules/
❌ .next/
❌ *.db files
❌ test-*.js files
```

---

**Size Tip**: Keep total upload under 25MB for best results!
