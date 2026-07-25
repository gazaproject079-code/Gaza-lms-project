# Logo Setup Guide

## Current Implementation

The Logo component is already enhanced and displays professionally on Login and Signup pages with:
- ✅ Enhanced SVG logo matching SkillSphere brand
- ✅ Electric blue to deep purple gradient
- ✅ Glowing effect
- ✅ Professional typography
- ✅ Image file support (if you have the actual logo)

## Using Your Logo Image File

If you have the actual SkillSphere logo image file:

### Step 1: Add Logo Image

1. Place your logo image file in: `src/assets/images/`
2. Supported formats: PNG (recommended), JPG, or SVG
3. Name it: `skillsphere-logo.png` (or your preferred name)

### Step 2: Update Login Screen

Edit `src/screens/auth/LoginScreen.js`:

```javascript
import Logo from '../../components/Logo';
import logoImage from '../../assets/images/skillsphere-logo.png';

// In the component, replace:
<Logo size={180} showText={true} glow={true} />

// With:
<Logo 
  size={180} 
  showText={true} 
  glow={true}
  useImage={true}
  imageSource={logoImage}
/>
```

### Step 3: Update Signup Screen

Edit `src/screens/auth/SignupScreen.js`:

```javascript
import Logo from '../../components/Logo';
import logoImage from '../../assets/images/skillsphere-logo.png';

// In the component, replace:
<Logo size={180} showText={true} glow={true} />

// With:
<Logo 
  size={180} 
  showText={true} 
  glow={true}
  useImage={true}
  imageSource={logoImage}
/>
```

## Current SVG Logo

The current SVG logo implementation:
- Matches the SkillSphere brand perfectly
- Has electric blue to deep purple gradient
- Includes glowing effect
- Shows network/circuit board pattern
- Displays "SkillSphere" text with gradient

## Logo Features

- **Size**: 180px on login/signup pages (larger and more prominent)
- **Glow Effect**: Enhanced shadow and glow for professional look
- **Gradient**: Blue (#3b82f6) to Purple (#8b5cf6)
- **Typography**: Modern sans-serif with gradient text
- **Animation**: Fade-in animation on page load

## File Structure

```
src/
├── assets/
│   └── images/
│       ├── README.md
│       └── skillsphere-logo.png (add your logo here)
├── components/
│   └── Logo.js (supports both SVG and Image)
└── screens/
    └── auth/
        ├── LoginScreen.js (logo displayed)
        └── SignupScreen.js (logo displayed)
```

